let webdriver = require('selenium-webdriver');
By = webdriver.By,
until = webdriver.until;
let driver = new webdriver.Builder().forBrowser('firefox').build();

describe('BBB HTML5 meeting tests', function() {
    before(function() {

    });
    
    beforeEach(function() {
        driver.manage().window().maximize();
        driver.get('https://romania.cdot.systems/b/tes-pez-xew');
    });

    after(function() {
        // driver.quit();
    });

    afterEach(function() {

    });

    it('joins a meeting via Greenlight', function() {
        let username = "test";
        let nameField = driver.findElement(By.className('join-form'));
        nameField.sendKeys(username);

        let joinBtn = driver.findElement(By.className('btn-primary'));
        joinBtn.click();

        async function clickAfterLoad() {
            let listenOnlyBtn =
                await driver.wait(until.elementLocated(By.xpath('//button[2]/span[2]')), 10000);
            await listenOnlyBtn.click();
        }
        clickAfterLoad();
    });
});
