let webdriver = require('selenium-webdriver');
const geckodriver = require('geckodriver');
By = webdriver.By,
until = webdriver.until;

// Join via Greenlight
// (async () => {
//     try {
//         let driver = await new webdriver.Builder().forBrowser('firefox').build();
//         // await driver.manage().window().maximize();
//         await driver.get('https://romania.cdot.systems/b/mat-aeu-e97');
//         let nameField = await driver.findElement(By.className('join-form'));
//         await nameField.sendKeys("capturebot");
//         let joinBtn = await driver.findElement(By.className('btn-primary'));
//         await joinBtn.click();
//         let listenOnlyBtn = await driver.wait(until.elementLocated(By.css('button[aria-label="Listen Only"]')), 10000);
//         await listenOnlyBtn.click();
//     }
//     catch (error) {
//         console.error(error);
//     }
// })()

// Join via dev22
(async () => {
    try {
        let driver = await new webdriver.Builder().forBrowser('firefox').build();
        // await driver.manage().window().maximize();
        // await driver.manage().window().fullscreen();
        await driver.get('https://dev22.bigbluebutton.org/demo/demoHTML5.jsp');
        let nameField = await driver.findElement(By.name('username'));
        await nameField.sendKeys("capturebot");
        let meetingField = await driver.findElement(By.name('meetingname'));
        await meetingField.clear();
        await meetingField.sendKeys("Livestream Demo Meeting");
        let joinBtn = await driver.findElement(By.css('input[value="Join"]'));
        await joinBtn.click();
        let listenOnlyBtn = await driver.wait(until.elementLocated(By.css('button[aria-label="Listen Only"]')), 10000);
        await listenOnlyBtn.click();
    }
    catch(error) {
        console.error(error);
    }
})()
