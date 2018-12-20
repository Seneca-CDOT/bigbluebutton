const express = require ('express');
const { exec } = require('child_process');
const app = express();
const port = 3000;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
    next();
});

app.get("/start", (req, res) => {
    console.log("Starting...");
    // should accept a meeting name, password, and rtmp endpoint,
    // then issue kube to start a container and return an ID
    exec("kubectl run --image=broadcast-bot", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        };
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
});

app.get("/stop", (req, res) => {
    res.send("Stopping...");
    // should accept an ID and issue kube to kill the container by that ID
});

app.get("/status", (req, res) => {
    // should accept an ID and return a success or failure message
    res.send("Getting status");
});

app.listen(port, (err) => {
    if (err) {
        throw err;
    }
    console.log(`Running on port ${port}`);
});
