const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const Tijou = require("./tijou.js")

app.use(express.json())
app.use(express.static(__dirname + '/public/'));

app.get("/", (req, res) =>  {
    return res.sendFile(__dirname + '/views/index.html')
})

app.get("/rooms", (req, res) =>  {
    return res.sendFile(__dirname + '/views/rooms.html')
})

app.get("/play", (req, res) =>  {
    if (req.query.roomId && wss.rooms.hasOwnProperty(req.query.roomId))return res.sendFile(__dirname + '/views/tijou.html')
    return res.redirect("/rooms")
})

app.use(function(req, res) {
    res.status(404).sendFile(__dirname + '/views/errors/404.html');
});

function send(ws, title, body = {}){
    ws.send(JSON.stringify({title: title, body: body}))
}

function handleRooms(ws){
    send(ws, "rooms", Object.keys(wss.rooms))
    ws.on('message', (message) => {
        message = JSON.parse(message)
        var title = message.title
        var body = message.body
        switch (title) {
            case "createRoom":
                let roomId
                do{
                    roomId = generateToken()
                }while(wss.rooms.hasOwnProperty(roomId))
                wss.rooms[roomId] = createGameFromType(body.gameType)
                send(ws, "roomCreated", {roomId: roomId})
                break;
            default: console.log(title, body);
        }
    });
}

function createGameFromType(gameType){
    switch (gameType) {
        case "tijou":
            return new Tijou()
    }
    return new Tijou()
}

function handleTijou(ws){
    ws.on('message', (message) => {
        message = JSON.parse(message)
        var title = message.title
        var body = message.body
        switch (title) {
            case "join":
                if (!wss.games[ws.game][body.roomId])send("error", "noRoom")
                wss.games[ws.game][body.roomId].push(ws)
                break;
            default: console.log(body);
        }
    });
}

wss.rooms = {}
wss.on('connection', (ws, req) => {
    let url = req.url.slice(1)
    switch (url) {
        case "rooms":
            handleRooms(ws)
            break;
        case "tijou":
            handleTijou(ws)
            break;
        default:
            break;
    }
    ws.on("close", () => {
        //wss.games[ws.game][ws.room].splice(wss.games[ws.game].indexOf(ws), 1)
    });
});

function generateToken(length = 8){
    //edit the token allowed characters
    var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
    var b = [];  
    for (var i=0; i<length; i++) {
        var j = (Math.random() * (a.length-1)).toFixed(0);
        b[i] = a[j];
    }
    return b.join("");
}

server.listen(3000, () => {
    console.log('listening on *:3000');
});