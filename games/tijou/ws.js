const send = require("../../utils.js")
function handleTijou(wss, ws){
    ws.on('message', (message) => {
        message = JSON.parse(message)
        var title = message.title
        var body = message.body
        switch (title) {
            case "join":
                let room = wss.rooms[body.roomId]
                if (!room)send(ws, "error", "noRoom")
                room.addPlayer(ws)
                ws.room = room
                send(ws, "playerId", {playerId: room.players.length-1})
                break;
            case "startGame":
                ws.room.start()
                break;
            case "playCard":
                if (!body.hasOwnProperty("cardIndex"))return send(ws, "error", "card error")
                ws.room.playCard(body.cardIndex, body.pawnIndex, body.option)
                break
            default: console.log(body);
        }
    });
}

module.exports = handleTijou