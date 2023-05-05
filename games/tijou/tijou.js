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
    move(i, n, eat=false){
        if(this.pawns[i]!=-1){
            this.pawns[i] = (this.pawns[i] + n)%this.boardCellNb
            if (this.pawns[i]<0)this.pawns[i]+=this.boardCellNb
        }
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
        this.boardRowSize = 10
        this.boardCellNb = this.boardRowSize*2 + (this.boardRowSize-2)*2
    }
    nextTurn(){
        this.indexPlayerTurn = (this.indexPlayerTurn+1)%this.players.length
        if (this.players[this.indexPlayerTurn].cards.length > 0) this.players[this.indexPlayerTurn].turn()
        else this.nextRound()
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
        this.indexPlayerTurn = (this.indexPlayerTurn+1)%this.players.length
        this.sendToAllPlayers("pawnsPositions", this.players.map(p => p.pawns))
        this.sendHands()
        this.nextTurn()
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
    }
    CheckEatOnCell(player, pawnIndex, pos){
        for (let i = 0; i < this.players.length; i++) {
            for (let p = 0; p < this.players[i].pawns.length; p++) {
                if (!(this.players[i].playerId == player.playerId && pawnIndex == p)){
                    let opponentPawn = this.players[i].pawns[p];
                    if (opponentPawn == pos)this.players[i].pawns[p] = -1
                }
            }
        }
    }
    MoveAction(player, dist, pawnIndex, eat=false){
        if(eat){
            let pawn = player.pawns[pawnIndex]
            for (let n = pawn; n < pawn+dist; n++) {
                let pos = n%this.boardCellNb
                this.CheckEatOnCell(player, pawnIndex, pos)
            }
        }
        player.move(pawnIndex,dist)
    }
    Exchange(player, pawnIndex, opponent, opponentPawnIndex){
        console.log(player.playerId, pawnIndex, opponent.playerId, opponentPawnIndex)
        let temp = player.pawns[pawnIndex]
        if (temp == -1 || opponent.pawns[opponentPawnIndex] == -1) return console.log("error in exchange")
        player.pawns[pawnIndex] = opponent.pawns[opponentPawnIndex]
        opponent.pawns[opponentPawnIndex] = temp
    }
    Arrive(player, pawnIndex){
        console.log("arrive")
        for (let i = 0; i < player.pawns.length; i++) {
            if (player.pawns[i]==-1)return console.log("can't arrive cause not all pawns are on board")
        }
        player.pawns[pawnIndex] = this.boardCellNb
    }
    cardAction(player, pawnIndex, card, action, option=-1){
        switch (card[1]) {
            case 3:
            case 6:
            case 7:
            case 8:
            case 9:
                this.MoveAction(player, card[1], pawnIndex)
                break;
            case 10:
                if (action == actions.ARRIVE)this.Arrive(player, pawnIndex)
                else this.MoveAction(player, card[1], pawnIndex)
                break;
            case 1:
            case 12:
            case 13:
                if(player.pawns[pawnIndex] == -1)player.enterPawn(pawnIndex)
                else if(action == actions.MOVE)this.MoveAction(player, card[1], pawnIndex)
                break;
            case 2:
                if(player.pawns[pawnIndex] == -1)player.enterPawn(pawnIndex)
                else if(action == actions.MOVE)this.MoveAction(player, card[1], pawnIndex)
                else if (action == actions.BACKWARD)this.MoveAction(player, -card[1], pawnIndex, true)
                else if (action == actions.ARRIVE)this.Arrive(player, pawnIndex)
                break;
            case 4:
                if (action == actions.ARRIVE)this.Arrive(player, pawnIndex)
                else this.MoveAction(player, -card[1], pawnIndex)
                break;
            case 5:
                this.MoveAction(player, card[1], pawnIndex, true)
                break;
            case 11:
                //TODO verify opponent existence
                console.log("exchnge")
                this.Exchange(player, pawnIndex, this.players[option.playerId], option.pawnIndex)
                break;
            case 14:
                this.cardAction(player, pawnIndex, [0, option], action)
                break;
            default:
                console.log("card action error on card : "+ card[1])
                break;
        }
        this.CheckEatOnCell(player, pawnIndex, player.pawns[pawnIndex])
    }
    playCard(playerId, cardIndex, pawnIndex, action, option=-1){
        let player = this.players[playerId]
        if(playerId != this.indexPlayerTurn)return send(player.ws, "error", "notYourTurn")
        let card = player.cards.splice(cardIndex, 1)[0]
        this.cardAction(player, pawnIndex, card, action, option)
        this.sendHands()
        this.sendPawnsPositions()
        this.nextTurn()
    }
};

const actions = {
    MOVE: "move",
    ENTER: "enter",
    BACKWARD: "backward",
    EXCHANGE: "exchange",
    ARRIVE: "arrive"
}

module.exports = Tijou