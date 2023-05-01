const send = require("../utils.js")
class Game{
    constructor(gameType, MAX_NB_PLAYER){
        this.gameType = gameType;
        this.MAX_NB_PLAYER = MAX_NB_PLAYER
        this.hasStarted = false
        this.players = []
    }
    canAddPlayer(){
        return this.players.length < this.MAX_NB_PLAYER
    }
    sendToAllPlayers(title, body){
        this.players.forEach(player => {
            send(player.ws, title, body)
        })
    }
}

module.exports = Game