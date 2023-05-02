const Game = require("../game.js")
const send = require("../../utils.js")
class Player{
    constructor(ws, playerId){
        this.ws = ws
        this.cards = [] 
        this.pawns = [-1, -1, -1]
        this.playerId = playerId
        this.boardRowSize = 10
        this.boardCellNb = this.boardRowSize*2 + (this.boardRowSize-2)*2
        this.enterPos = playerId * (this.boardRowSize-1)
    }
    turn(){
        send(this.ws, "yourTurn")
    }
    sendHand(){
        send(this.ws, "hand", {cards: this.cards})
    }
    enterPawn(i){
        if(this.pawns[i] == -1)this.pawns[i] = this.enterPos
    }
    move(i, n){
        if(this.pawns[i]!=-1)this.pawns[i] = (this.pawns[i] + n)%this.boardCellNb
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
        this.indexPlayerTurn = -1
    }
    nextTurn(){
        this.indexPlayerTurn = (this.indexPlayerTurn+1)%this.players.length
        this.players[this.indexPlayerTurn].turn()
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
        this.sendToAllPlayers("pawnsPositions", this.players.map(p => p.pawns))
    }
    shuffle(deck){
        deck.sort(() => Math.random() - 0.5);
    }
    addPlayer(ws){
        let reconnect = -1
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i]
            if(player.ws.readyState == ws.CLOSED)reconnect = i
        }
        if (reconnect != -1){
            this.players[reconnect].ws = ws
            if (this.hasStarted){
                this.players[reconnect].sendHand()
                this.sendPawnsPositions()
            }
        }
        else if (this.canAddPlayer())this.players.push(new Player(ws, this.players.length))
    }
    sendHands(){
        this.players.forEach(player => {
            player.sendHand()
        })
    }
    sendPawnsPositions(){
        this.sendToAllPlayers("pawnsPositions", this.players.map(p => p.pawns))
    }
    start(){
        this.hasStarted = true
        this.nextRound()
        this.sendHands()
        this.nextTurn()
    }
    cardAction(player, pawnIndex, card, action){
        switch (card[1]) {
            case 1:
            case 2:
            case 12:
            case 13:
                if(action == actions.MOVE)player.move(pawnIndex,card[1])
                else if (action == actions.ENTER)player.enterPawn(pawnIndex)
                break;
            case 14:
                break
            default:
                player.move(pawnIndex,card[1])
                break;
        }
    }
    playCard(playerId, cardIndex, pawnIndex, action){
        let player = this.players[playerId]
        if(playerId != this.indexPlayerTurn)return send(player.ws, "error", "notYourTurn")
        let card = player.cards.splice(cardIndex, 1)[0]
        this.cardAction(player, pawnIndex, card, action)
        this.sendHands()
        this.sendPawnsPositions()
        this.nextTurn()
    }
};

const actions = {
    MOVE: "move",
    ENTER: "enter",
    BACKWARD: "backward",
    EXCHANGE: "exchange"
}

module.exports = Tijou