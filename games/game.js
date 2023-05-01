class Game{
    constructor(gameType, MAX_NB_PLAYER){
        this.gameType = gameType;
        this.MAX_NB_PLAYER = MAX_NB_PLAYER
        this.hasStarted = false
    }
    canAddPlayer(){
        return this.players.length < this.MAX_NB_PLAYER
    }
}

module.exports = Game