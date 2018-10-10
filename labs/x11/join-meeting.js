let webdriver = require('selenium-webdriver');
const geckodriver = require('geckodriver');
By = webdriver.By,
until = webdriver.until;
let driver = new webdriver.Builder().forBrowser('firefox').build();

driver.manage().window().maximize();
driver.get('https://romania.cdot.systems/b/tes-pez-xew');

let username = "test";
let nameField = driver.findElement(By.className('join-form'));
nameField.sendKeys(username);

let joinBtn = driver.findElement(By.className('btn-primary'));
joinBtn.click();

async function clickAfterLoad() {
    let listenOnlyBtn = 
    await driver.wait(until.elementLocated(By.css('button[aria-label="Listen Only"]')), 10000);
    await listenOnlyBtn.click();
}
clickAfterLoad();