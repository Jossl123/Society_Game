
function handleTijou(wss, ws){
    ws.on('message', (message) => {
        message = JSON.parse(message)
        var title = message.title
        var body = message.body
        switch (title) {
            case "join":
                let room = wss.rooms[body.roomId]
                if (!room)send("error", "noRoom")
                room.addPlayer(ws)
                ws.room = room
                break;
            case "startGame":
                ws.room.start()
            default: console.log(body);
        }
    });
}

module.exports = handleTijou