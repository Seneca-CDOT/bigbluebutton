let webdriver = require('selenium-webdriver');
const geckodriver = require('geckodriver');
By = webdriver.By,
until = webdriver.until;
let driver = new webdriver.Builder().forBrowser('firefox').build();

driver.manage().window().maximize();
driver.get('https://romania.cdot.systems/b/mat-aeu-e97');

(async () => {
    let nameField = await driver.findElement(By.className('join-form'));
    await nameField.sendKeys("test");
    let joinBtn = await driver.findElement(By.className('btn-primary'));
    await joinBtn.click();
    let listenOnlyBtn = await driver.wait(until.elementLocated(By.css('button[aria-label="Listen Only"]')), 10000);
    await listenOnlyBtn.click();
})()
