let webdriver = require('selenium-webdriver');
const geckodriver = require('geckodriver');
const args = require('minimist')(process.argv.slice(2));
By = webdriver.By,
until = webdriver.until;

let url = args['url'];
let meetingName = args['meeting'];
let password = args['password'];

// Join via dev22
// https://dev22.bigbluebutton.org/demo/demoHTML5.jsp
(async () => {
    try {
        let driver = await new webdriver.Builder().forBrowser('firefox').build();
        // await driver.manage().window().maximize();
        // await driver.manage().window().fullscreen();
        await driver.get(url);
        let nameField = await driver.findElement(By.name('username'));
        await nameField.sendKeys("broadcast-bot");
        let meetingField = await driver.findElement(By.name('meetingname'));
        await meetingField.clear();
        await meetingField.sendKeys(meetingName);
        let joinBtn = await driver.findElement(By.css('input[value="Join"]'));
        await joinBtn.click();
        let listenOnlyBtn = await driver.wait(until.elementLocated(By.css('button[aria-label="Listen Only"]')), 10000);
        await listenOnlyBtn.click();
    }
    catch(error) {
        console.error(error);
    }
})()
