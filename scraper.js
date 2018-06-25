/*
* Project name:         Build a Content Scraper
* Student name:         Alex Khant (http://github.com/grashupfer99)
* Updated:              2018-06-25
*/

// Require node js modules (scrape-it, file system, json2csv modules)
const scraper = require('scrape-it');
const fs = require('fs');
const csvParse = require('json2csv').Parser;

// Set default fields for csv file  
const fields = ["Title", "Price", "ImageURL", "URL", "Time"];
// Add fields, remove quotations marks, comma with a space between each entry in the file
const csvParser = new csvParse({ fields, quote: "", delimiter: ", " });
// website root and 'data' directory strings
const entryPoint = "http://shirts4midfke.com/shirts.php/";
const dir = './data';
// get current date
const date = new Date();
// array to store t-shirts 
let tShirtData = [];

// Create a new directory if it doesn't exist
if(!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// csv file handler, overwrites the data in the CSV file with the updated information
const csvHandler = (data) => {
    const parser = csvParser.parse(data);
    const fileName = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.csv`;
    fs.writeFile(`${dir}/${fileName}`, parser, error => {
      if (error) throw error;
    });
}

// Error message is displayed when the website is down 
const displayError = (error) => {
    if (error && error.code === "ENOTFOUND") {
        const errorMsg = `There's been a 404 error. Cannot connect to http://shirts4mike.com`;
        console.log(errorMsg);
      // When an error occurs, it is logged to a file named scraper-error.log 
        fs.appendFile("./scraper-error.log", `${date.toString()} <${errorMsg}>\n`, err => {
          if (err) throw error;
      });
    }
}

// Entry point (http://shirts4mike.com/shirts.php)
scraper(entryPoint, {
    shirts: {
        listItem: ".products li",
        data: {
            url: {
                selector: "a",
                attr: "href"
            }
        }
    }
}, (error) => {
    // If http://shirts4mike.com is down, display an error message and log it to scraper-error.log file
    displayError(error);
    // Get data
}).then(({data}) => {
    // store url for every for 8 t-shirts in an array
    const dataArr = data.shirts.map(url => `http://shirts4mike.com/${url.url}`);
    dataArr.map(url => {
        // for every t-shirt, get title, price, image url
        scraper(url, {
            Title: {
                selector: ".breadcrumb",
                convert: x => x.slice(x.indexOf('>') + 2)
            },  
            Price: ".price",
            'ImageURL': {
                selector: ".shirt-picture span img",
                attr: "src",
            }, 
            // get url, time
        }).then(({data})=>{
            data.URL = url;
            data.Time = Date();
            return data;
            // push info on every t-shirt into an array and store in a file 
        }).then(data => {
            tShirtData.push(data);
            csvHandler(tShirtData);
        });
    });
});