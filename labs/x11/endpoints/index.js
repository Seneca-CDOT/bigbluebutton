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

// should accept a meeting name, password, and rtmp endpoint,
// then issue kube to start a container and return the container/pod ID
app.get("/start", (req, res) => {
    console.log("Starting...");
    exec("kubectl run --image=broadcast-bot", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        };
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
});

// should accept an pod/container ID and issue kube to kill the container by that ID
app.get("/stop", (req, res) => {
    res.send("Stopping...");
    exec("kubectl delete pod,service $ID", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        };
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
});

// should accept a pod/container ID and return success if it exists or failure if not
app.get("/status", (req, res) => {
    res.send("Getting status...");
    // exec("kubectl get pods -o wide", (error, stdout, stderr) => {
    //     if (error) {
    //         console.error(`exec error: ${error}`);
    //         return;
    //     };
    //     console.log(`stdout: ${stdout}`);
    //     console.log(`stderr: ${stderr}`);
    // })
});

app.listen(port, (err) => {
    if (err) {
        throw err;
    }
    console.log(`Running on port ${port}`);
});
