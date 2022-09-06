const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json())
app.use(express.static(__dirname + '/public/'));

app.get("/", (req, res) =>  {
    return res.sendFile(__dirname + '/views/index.html')
})

app.get("/shifumi", (req, res) =>  {
    return res.sendFile(__dirname + '/views/shifumi.html')
})

app.use(function(req, res, next) {
    res.status(404).sendFile(__dirname + '/views/errors/404.html');
});

wss.on('connection', (ws) => {
    console.log(wss)
    ws.on('message', (message) => {
        // message = JSON.parse(message)
        // var title = message.title
        // var body = message.body
        // switch (title) {
        //     default: console.log(body);
        // }
    });
    ws.on("close", () => {
        console.log("ws")
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});