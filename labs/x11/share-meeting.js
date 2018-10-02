var webdriver = require('selenium-webdriver');

var browser = new webdriver.Builder().withCapabilities(webdriver.Capabilities.firefox()).build();

browser.get('https://www.google.com');

var promise = browser.getTitle();

promise.then(function(title) {
    console.log(title);
});

browser.quit();