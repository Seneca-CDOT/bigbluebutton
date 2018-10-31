let webdriver = require('selenium-webdriver');
const geckodriver = require('geckodriver');
By = webdriver.By,
until = webdriver.until;
let driver = new webdriver.Builder().forBrowser('firefox').build();

describe('BBB HTML5 meeting tests', function() {
    before(function() {
        driver.manage().window().maximize();
        driver.get('https://romania.cdot.systems/b/mat-aeu-e97');
    });
    
    beforeEach(function() {

    });

    after(async function() {
        await driver.sleep(9000);
        driver.quit();
    });

    afterEach(function() {

    });

    it('joins a meeting via Greenlight', async function() {
        let username = "testbot";
        let nameField = await driver.findElement(By.className('join-form'));
        nameField.sendKeys(username);

        let joinBtn = await driver.findElement(By.className('btn-primary'));
        joinBtn.click();

        let listenOnlyBtn = await driver.wait(until.elementLocated(By.css('button[aria-label="Listen Only"]')), 10000);
        listenOnlyBtn.click();
    });

    it('joins a meeting via dev2a', async function() {
        let username = "testbot";
        let nameField = await driver.findElement(By.className('join-form'));
        nameField.sendKeys(username);

        let joinBtn = await driver.findElement(By.className('btn-primary'));
        joinBtn.click();

        let listenOnlyBtn = await driver.wait(until.elementLocated(By.css('button[aria-label="Listen Only"]')), 10000);
        listenOnlyBtn.click();
    });
});
