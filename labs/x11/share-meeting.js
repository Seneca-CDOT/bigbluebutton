var webdriver = require('selenium-webdriver');
By = webdriver.By,
until = webdriver.until;
var driver;

describe('BBB app scenarios', function() {
    beforeEach(function() {
        driver = new webdriver.Builder().forBrowser('firefox').build();
        // Edit meeting room invitation link below
        driver.get('https://romania.cdot.systems/b/tes-pez-xew');
    });

    afterEach(function(){
        // driver.quit();
    });

    it('joins a meeting via Greenlight', function() {
        let username = "test";
        var nameField = driver.findElement(By.className('join-form'));
        nameField.sendKeys(username);
        var joinBtn = driver.findElement(By.className('btn-primary'));
        joinBtn.click();
        // var listenOnlyBtn = driver.findElement(By.xpath('//button[2]/span[2]'));
        // listenOnlyBtn.click();
    });
})
