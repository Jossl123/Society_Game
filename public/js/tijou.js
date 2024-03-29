var ws = new WebSocket(`ws:${window.location.host}/tijou`, "protocolOne");
ws.onopen = (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("roomId");
    send("join", {roomId: roomId})
};

const actions = {
    MOVE: "move",
    ENTER: "enter",
    BACKWARD: "backward",
    EXCHANGE: "exchange",
    ARRIVE: "arrive"
}

class Player{
    constructor(playerId){
        this.hand = []
        this.playerId = playerId
        this.state = "waiting"
        this.action = "move"
        this.reset()
    }
    receiveCards(cards){
        player.hand = cards
        this.showHand()
    }
    showHand(){
        let res = ""
        for (let i = 0; i < this.hand.length; i++) {
            let card = this.hand[i]
            res+=`<button class="card" style="transform: rotate(${i*10}deg)" onclick="player.play(${i})"><img src="./img/playing_cards/${toCard(card)}.png"></img></button>`
        }
        document.getElementById("hand").innerHTML = res
    }
    showActions(possibleAction){
        document.getElementById("actions").innerHTML = ""
        for (let i = 0; i < possibleAction.length; i++) {
            document.getElementById("actions").innerHTML += `<button onclick="player.play('${possibleAction[i]}')">${possibleAction[i]}</button>`
        }
    }
    yourTurn(){
        document.getElementById("infos").innerHTML = "Your turn"
        this.state = "chooseCard"
        document.getElementById("pawns").style.visibility = "visible"
    }
    play(index, playerId){
        switch (this.state) {
            case "chooseCard":
                if(playerId)return 
                if (index < 0 || index >= this.hand.length)return 
                this.cardIndexChoose = index
                if (this.hand[this.cardIndexChoose][1] == 14) this.chooseJoker()
                else this.state = "choosePawn"
                document.getElementById("cancelChoice").style.visibility = "visible"
                break;
            
            case "choosePawn":
                this.pawnIndexChoose = index
                this.state = "chooseAction"
                let possibleAction = this.possiblesAction(this.hand[this.cardIndexChoose])
                console.log(possibleAction)
                if(this.hand[this.cardIndexChoose][1] != 11 && this.options.jokerChoice != 11){
                    this.showActions(possibleAction)
                    document.getElementById("actions").style.visibility = "visible"
                }
                document.getElementById("pawns").style.visibility = "hidden"
                if(possibleAction.length == 1)this.play(possibleAction[0])
                break;

            case "chooseAction":
                document.getElementById("actions").style.visibility = "hidden"
                if(this.hand[this.cardIndexChoose][1] == 11 || this.options.jokerChoice == 11){
                    this.options.pawnIndex = index
                    this.options.playerId = playerId
                }
                this.action = index;
                this.state = "endTurn"
                this.endTurn()
                break;

            case "chooseJack":
                this.options.pawnIndex = index
                this.options.playerId = playerId
                break;

            case "chooseJoker":
                document.getElementById("pawns").style.visibility = "visible"
                this.options.jokerChoice = index
                document.getElementById("choices").style.visibility = "hidden"
                this.state = "choosePawn"
                break

            default:
                break;
        }
    }
    chooseJoker(){
        document.getElementById("pawns").style.visibility = "hidden"
        this.state = "chooseJoker"
        document.getElementById("choices").style.visibility = "visible"
    }
    endTurn(){
        console.log({cardIndex: this.cardIndexChoose, pawnIndex: this.pawnIndexChoose, action: this.action, options: this.options})
        send("playCard", {cardIndex: this.cardIndexChoose, pawnIndex: this.pawnIndexChoose, action: this.action, options: this.options})
        this.reset()
        this.state = "waiting"
        document.getElementById("infos").innerHTML = "Opponents turns"
    }
    reset(){
        document.getElementById("pawns").style.visibility = "visible"
        document.getElementById("choices").style.visibility = "hidden"
        document.getElementById("actions").style.visibility = "hidden"
        document.getElementById("cancelChoice").style.visibility = "hidden"
        this.pawnIndexChoose = -1
        this.cardIndexChoose = -1
        this.options = {pawnIndex: -1, playerId: -1, jokerChoice: -1}
        this.state = "chooseCard"
    }
    possiblesAction(card){
        let res = []
        if(card[1] == 14)return this.possiblesAction([0, this.options.jokerChoice])
        switch (card[1]) {
            case 1:
            case 2:
            case 3:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
            case 12:
            case 13:
                res.push(actions.MOVE)
                break
        }
        switch (card[1]) {
            case 1:
            case 2:
            case 12:
            case 13:
                res.push(actions.ENTER)
                break
        }
        switch (card[1]) {
            case 4:
            case 2:
                res.push(actions.BACKWARD)
                break
        }
        switch (card[1]) {
            case 11:
                res.push(actions.EXCHANGE)
                break
        }
        switch (card[1]) {
            case 2:
            case 4:
            case 10:
                res.push(actions.ARRIVE)
                break
        }
        return res
    }
}
let player
ws.onmessage = (event) => {
    let data = JSON.parse(event.data)
    let title = data.title
    let body = data.body
    switch (title) {
        case "error":
            handleError(body)
            console.log("Error : " + body)
            break;
        case "playerId":
            player = new Player(body.playerId)
            break;
        case "hand":
            player.receiveCards(body.cards)
            break;
        case "pawnsPositions":
            receivePawnsPosition(body)
            break;
        case "gameStarted":
            let s = document.getElementById("start")
            s.parentNode.removeChild(s)
            break;
        case "yourTurn":
            player.yourTurn()
            break;
        default:
            console.log(title)
            break;
    }
};

let pawnsPositions = []
function receivePawnsPosition(pos){
    pawnsPositions = pos
    showBoard()
}

function handleError(msg){
    switch (msg) {
        case "notYourTurn":
            document.getElementById("infos").innerHTML = "Not your turn"
            break;
    
        default:
            document.getElementsByTagName("body")[0].innerHTML = msg
            break;
    }
}

function toCard(card){
    let name = card[1]
    if (card[1] == 1)name = "ace"
    else if (card[1] == 11)name = "jack"
    else if (card[1] == 12)name = "queen"
    else if (card[1] == 13)name = "king"
    let color = ""
    if (card[0] == 0)color = "clubs"
    else if(card[0] == 1)color = "diamonds"
    else if (card[0] == 2) color = "hearts"
    else if (card[0] == 3) color = "spades"

    if (card[1] == 14)return  "red_joker"
    return name + "_of_" + color
}

function toColor(num){
    let colors = ["red", "green", "blue", "yellow"]
    return colors[num]
}
function getBoardCellId(x, y){
    let id = x
    if(y>0){
        if (x == rowSize-1)id=x+y
        else if(x==0)id=cellNb-y
    }
    if (y==rowSize-1)id = cellNb-y-x
    return cellNb-id
}

function getPawnOnCell(id){
    let offset = 5
    let res = {id: -1, player: -1}
    for (let p = 0; p < pawnsPositions.length; p++) {
        if (pawnsPositions[p].indexOf((id+offset)%cellNb) != -1){
            res.player = p
            res.id = pawnsPositions[p].indexOf((id+offset)%cellNb) 
            return res
        }
    }
    return res
}
let rowSize=10
let cellNb = rowSize*2 + (rowSize-2)*2

function showBoard(){
    let boardMap = ""
    for (let y = 0; y < rowSize; y++) {
        for (let x= 0; x < rowSize; x++) {
            let onBoard = (x==0||y==0||x==rowSize-1||y==rowSize-1)
            if(onBoard){
                let id = getBoardCellId(x, y)
                let pawnInfos = getPawnOnCell(id)
                boardMap+=`<div class="boardCell">${id}`
                if (pawnInfos.id != -1){
                    boardMap+=`<button `
                    if (pawnInfos.player == player.playerId)boardMap+=`onclick="player.play(${pawnInfos.id}, ${pawnInfos.player})" style="background-color: ${toColor(pawnInfos.player)}"`
                    else boardMap+=`onclick="player.play(${pawnInfos.id}, ${pawnInfos.player})"`
                    boardMap+=`>${id}</button>`
                }
                boardMap+=`</div>`
            }else{
                boardMap+=`<div class="boardEmptyCell"></div>`
            }
        }
    }
    document.getElementById("board").innerHTML = boardMap
    document.getElementById("pawns").innerHTML = ""
    for (let j = 0; j < pawnsPositions[player.playerId].length; j++) {
        if (pawnsPositions[player.playerId][j] == -1)document.getElementById("pawns").innerHTML+=`<button class="pawn" onclick="player.play(${j}, ${player.playerId})" >pawn</button>`
    }
}

function start(){
    send("startGame")
}