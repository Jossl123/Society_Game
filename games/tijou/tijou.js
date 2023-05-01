const Game = require("../game.js")
const send = require("../../utils.js")
class Player{
    constructor(ws, enterPos){
        this.ws = ws
        this.cards = [] 
        this.pawns = [-1, -1, -1]
        this.enterPos = enterPos
    }
    turn(){
        return this.cards.shift()
    }
    sendHand(){
        send(this.ws, "hand", {cards: this.cards})
    }
    enterPawn(i){
        if(this.pawns[i] == -1)this.pawns[i] = this.enterPos
    }
    move(i, n){
        console.log(this.pawns[i])
        if(this.pawns[i]!=-1)this.pawns[i] = (this.pawns[i] + n)%32
        console.log(this.pawns[i])
    }
}

class Tijou extends Game{
    constructor(){
        super("tijou", 4)
        this.cards = []
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 13; j++) {
                this.cards.push([i, j+1])
            }
        }
        for (let i = 0; i < 2; i++) {this.cards.push([4, 14])}//joker
        this.shuffle(this.cards)
        this.discard = []
        this.players = []
        this.indexPlayerTurn = 0
    }
    nextTurn(){
        this.indexPlayerTurn = (this.indexPlayerTurn+1)%this.players.length
        this.players.turn()
    }
    nextRound(){
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < this.players.length; j++) {
                if (this.cards.length == 0){
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
        this.sendToAllPlayers("board", this.players.map(p => p.pawns))
    }
    shuffle(deck){
        deck.sort(() => Math.random() - 0.5);
    }
    addPlayer(ws){
        if (this.canAddPlayer())this.players.push(new Player(ws, this.players.length * 9))
        console.log("add player")
    }
    start(){
        this.hasStarted = true
        this.nextRound()
        this.players.forEach(player => {
            player.sendHand()
        })
    }
    playCard(cardIndex, pawnIndex, option){
        let player = this.players[this.indexPlayerTurn]
        let card = player.cards.splice(cardIndex, 1)[0]
        switch (card[1]) {
            case 1:
            case 2:
            case 12:
            case 13:
                if(option == 0)player.move(pawnIndex,card[1])
                else if (option == 1)player.enterPawn(pawnIndex)
                break;
            default:
                player.move(pawnIndex,card[1])
                break;
        }
        player.sendHand()
        this.sendToAllPlayers("board", this.players.map(p => p.pawns))
    }
};

module.exports = Tijou