const cheerio = require('cheerio');
const fetch = require('node-fetch');
var fs = require('fs');
var https = require('https');
const urlMainPage = "https://www.acefitness.org/education-and-resources/lifestyle/exercise-library/body-part/chest/"
const domainName= "https://www.acefitness.org";
const pageCount = 4;
const bodyPart = "Chest";
var dataBase = [];
var rowId = 10000;

const getMainPages = async () =>{
    for(var k=0; k<pageCount; k++){
        const urlMain = urlMainPage+'?page='+(k+1);
        await fetch(urlMain)
        .then(res => res.text())
        .then( async (body) => {
            const $ = cheerio.load(body);
            const cards = await $(".exercise-card-grid__cell > a");
            for(var i=0; i< cards.length ; i++){
                const card = cards[i];
                const chiledPage = domainName+card.attribs.href;
                await getMainData(chiledPage);
            }
            console.log(cards.length);
        });
    }
    let jsonDataFormat = { dataBase };
    fs.writeFile('ExerciseDataBase.json', JSON.stringify(jsonDataFormat), function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
}

const getMainData = async (chiledPage) =>{
    let rowdata = {
        _id: rowId++,
        bodyPart,
    };
    let exerciseName = chiledPage.split("/");
    exerciseName = exerciseName[exerciseName.length-2];
    rowdata.exerciseName = exerciseName;
    await fetch(chiledPage)
        .then(res => res.text())
        .then( async (body) => {
            const $ = cheerio.load(body);
            let description = await $(".exercise-post__step-content").html();
            description = description.trim().replace(/\n/g, " ");
            description = description.split("\t\t\t");
            rowdata.description = description[0].toString();
            const images = await $("script:contains('\"images\"')");
            const imgdom = images[0].children[0].data;
            let imgarr = imgdom.split("[");
            imgarr = imgarr[1].split("]");
            imgarr = imgarr[0].split(",")
            let imagesName = [];
            for(let i=0; i <imgarr.length; i++){
                const imgUrl = imgarr[i].substring(1, imgarr[i].length-1);
                let imgExtention = imgUrl.split(".");
                imgExtention = imgExtention[imgExtention.length-1];
                const imgName = exerciseName + '-' + i + '.' +imgExtention;
                imagesName.push(imgName);
                const path = './asset/'+imgName;
                saveImageToDisk(imgUrl, path);
            }
            rowdata.imagesName = imagesName;
        });
        console.log(rowdata);
        dataBase.push(rowdata);
}

async function saveImageToDisk(url, localPath) {
    var file = fs.createWriteStream(localPath);
    https.get(url, function(response) {
        response.pipe(file);
    });
}

// saveImageToDisk( "https://acewebcontent.azureedge.net/exercise-library/large/167-5.jpg", "./asset/chest_10001.jpg");
getMainPages();