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

// should accept a meeting name, password, rtmp endpoint, and unique identifier (pod name/label)
// then issue kube to start a container and return the unique pod identifier
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

// should accept a unique identifier (pod name/label) for the pod and issue kube to kill the pod with that name/label
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

// should accept a unique identifier (pod name/label) for the pod and issue kube to check for existing pods with that name/label
app.get("/status", (req, res) => {
    res.send("Getting status...");
    exec("kubectl get pods -o wide", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        };
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    })
});

app.listen(port, (err) => {
    if (err) {
        throw err;
    }
    console.log(`Running on port ${port}`);
});
