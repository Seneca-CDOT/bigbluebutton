const express = require ('express');
// const bodyParser = require('body-parser');
const { exec } = require('child_process');
const app = express();
const port = 3000;

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
});

app.get("/start", (req, res) => {
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
