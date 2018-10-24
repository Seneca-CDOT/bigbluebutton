let webdriver = require('selenium-webdriver');
const geckodriver = require('geckodriver');
By = webdriver.By,
until = webdriver.until;
let driver = new webdriver.Builder().forBrowser('firefox').build();

driver.manage().window().maximize();
// driver.get('https://romania.cdot.systems/b/mat-aeu-e97');
driver.get('https://dev2a.bigbluebutton.org/demo/demoHTML5.jsp');

// Join via Greenlight
// (async () => {
//     let nameField = await driver.findElement(By.className('join-form'));
//     await nameField.sendKeys("capturebot");
//     let joinBtn = await driver.findElement(By.className('btn-primary'));
//     await joinBtn.click();
//     let listenOnlyBtn = await driver.wait(until.elementLocated(By.css('button[aria-label="Listen Only"]')), 10000);
//     await listenOnlyBtn.click();
// })()

// Join via dev2a
(async () => {
    let nameField = await driver.findElement(By.name('username'));
    await nameField.sendKeys("capturebot");
    let joinBtn = await driver.findElement(By.css('input[value="Join"]'));
    await joinBtn.click();
    let listenOnlyBtn = await driver.wait(until.elementLocated(By.css('button[aria-label="Listen Only"]')), 10000);
    await listenOnlyBtn.click();
})()