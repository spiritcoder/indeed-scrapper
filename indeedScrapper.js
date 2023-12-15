let puppeteer = require("puppeteer-extra");
let StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const $ = require("cheerio");
var fs = require("fs");
var path = require("path");
const excelJS = require("exceljs");

async function scrapeIndeed(searchUrl) {
  // Launch a new browser instance
  const browser = await puppeteer.launch({ headless: "new" });

  // Create a new page within the browser
  const page = await browser.newPage();

  const pageContent = await page
    .goto(searchUrl, { waitUntil: "domcontentloaded" })
    .then((http) => {
      return page.evaluate(() => document.querySelector("*").outerHTML);
    });
  const URLs = [];
  $("a.jcs-JobTitle", pageContent).each(async function () {
    const urlKey = $(this).attr("href").split("=")[1].split("&")[0];
    URLs.push(`${urlKey}`);
  });
  await browser.close();
  scrapeIndeed2(URLs);
}

async function scrape(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  //   const jobs = [];
  const pager = await page
    .goto(url, {
      waitUntil: "domcontentloaded",
    })
    .then((http) => {
      return page.evaluate(() => document.querySelector("*").outerHTML);
    });
  title = $("div h1 span", pager).text();
  company = $("[data-company-name=true]", pager).text();
  city = $("div.css-6z8o9s", pager).text();
  salary = $("div.ecydgvn1", pager).text();
  description = $("div#jobDescriptionText", pager)
    .text()
    .replace(/(<([^>]+)>)/gi, "");
  // pagination = $("a.e8ju0x50", pager).length;
  // console.log(pagination);

  await browser.close();

  return {
    title,
    company,
    city,
    salary,
    url,
    description,
  };
}

async function scrapeIndeed2(searchUrls) {
  const browser = await puppeteer.launch({ headless: "new" });
  // Create a new page within the browser
  const workbook = new excelJS.Workbook(); // Create a new workbook
  const worksheet = workbook.addWorksheet("My Users"); // New Worksheet

  worksheet.columns = [
    { key: "title", header: "Title" },
    { key: "company", header: "Company" },
    { key: "city", header: "City" },
    { key: "salary", header: "Salary" },
    { key: "url", header: "URL" },
    { key: "description", header: "Description" },
  ];

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });

  for (var i = 0; i < searchUrls.length; i++) {
    const scraper = await scrape(
      `https://nl.indeed.com/viewjob?jk=${searchUrls[i]}`
    );
    worksheet.addRow(scraper);
  }

  const exportPath = path.resolve(__dirname, "indeedjobs.xlsx");
  await workbook.xlsx.writeFile(exportPath);
}

var urls = fs.readFileSync("./indeedURLs.txt").toString("utf-8");
var urlList = urls.split("\n");
console.log(urlList);
// Provide the direct search URL as a command-line argument
for (var i = 0; i < urlList.length; i++) {
  scrapeIndeed(urlList[i]);
}
