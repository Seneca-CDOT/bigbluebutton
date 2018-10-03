var assert = require('assert');
var webdriver = require('selenium-webdriver'),
    { describe, it, after, before } = require('selenium-webdriver/testing');
    By = webdriver.By,
    until = webdriver.until;
    var driver;

describe('library app scenarios', function() {
    beforeEach(function() {
        driver = new webdriver.Builder().forBrowser('firefox').build();
        // Edit meeting room invitation link below
        driver.get('https://romania.cdot.systems/b/tes-pez-xew');
    });

    afterEach(function(){
        driver.quit();
    });

    it('joins a meeting via Greenlight', function(){
        var joinBtn = driver.findElement(By.className('button_to'));
        joinBtn.click();
    });

})
