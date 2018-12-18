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
    console.log("reached start endpoint");
    exec("./capture.sh -o $OUTFILE -u $URL -m $MEETING -p $PASSWORD", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        };
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
});

app.get("/stop", (req, res) => {
    res.send("Stopped!");
});

app.get("/status", (req, res) => {
    res.send("Status!");
});

app.listen(port, (err) => {
    if (err) {
        throw err;
    }
    console.log(`Running on port ${port}`);
});
