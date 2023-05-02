const send = require("../../utils.js")
function handleTijou(wss, ws){
    ws.on('message', (message) => {
        message = JSON.parse(message)
        var title = message.title
        var body = message.body
        switch (title) {
            case "join":
                let room = wss.rooms[body.roomId]
                if (!room)return send(ws, "error", "noRoom")
                if(room.hasStarted){
                    let reconnect = false
                    room.players.forEach(player => {
                        reconnect = reconnect || player.ws.readyState == ws.CLOSED
                    })
                    if(!reconnect) return send(ws, "error", "gameAlreadyStarted")
                }
                room.addPlayer(ws)
                ws.room = room
                ws.playerId = room.players.length-1
                send(ws, "playerId", {playerId: ws.playerId})
                break;
            case "startGame":
                if(!ws.room)return send(ws, "error", "noRoom")
                if(ws.room.hasStarted)return send(ws, "error", "gameAlreadyStarted")
                ws.room.start()
                ws.room.players.forEach(player => {
                    send(player.ws, "gameStarted")
                });
                break;
            case "playCard":
                if (!body.hasOwnProperty("cardIndex"))return send(ws, "error", "card error")
                if (!body.hasOwnProperty("action"))return send(ws, "error", "card action error")
                if (!body.hasOwnProperty("pawnIndex"))return send(ws, "error", "pawn error")
                ws.room.playCard(ws.playerId, body.cardIndex, body.pawnIndex, body.action)
                break
            default: console.log(body);
        }
    });
}

module.exports = handleTijou