let webdriver = require('selenium-webdriver');
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
        let username = "test";
        let nameField = await driver.findElement(By.className('join-form'));
        nameField.sendKeys(username);

        let joinBtn = await driver.findElement(By.className('btn-primary'));
        joinBtn.click();

        let listenOnlyBtn = await driver.wait(until.elementLocated(By.xpath('//button[2]/span[2]')), 10000);
        listenOnlyBtn.click();
    });
});