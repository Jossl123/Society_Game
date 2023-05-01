class Player{
    constructor(ws){
        this.cards = [] 
        this.ws = ws
    }
    turn(){
        return this.cards.shift()
    }
}

class Tijou{
    constructor(wsPlayer1){
        this.gameType = "tijou"
        this.cards = []
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 13; j++) {
                this.cards.push([i, j+1])
            }
        }
        for (let i = 0; i < 2; i++) {this.cards.push([4, 14])}//joker
        this.discard = []
        this.players = [new Player(wsPlayer1)]
        this.indexPlayerTurn = 0
    }
    nextTurn(){
        this.indexPlayerTurn = (this.indexPlayerTurn+1)%this.players.length
        this.players.turn()
    }
    nextRound(){
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < this.players.length; j++) {
                if (this.cards.length = 0){
                    this.cards = this.discard
                    this.discard = []
                    this.shuffle(this.cards)
                }
                this.players[j].cards.push(this.cards.shift())
            }
        }
        this.players.forEach(player => {
            player.ws.send(JSON.stringify({title: "hand", body: player.cards}))
        })
    }
    shuffle(deck){
        deck.sort(() => Math.random() - 0.5);
    }
};

module.exports = Tijou