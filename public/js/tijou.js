var ws = new WebSocket(`ws:${window.location.host}/tijou`, "protocolOne");
ws.onopen = (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("roomId");
    send("join", {roomId: roomId})
};

let hand = []
let pawnsPositions = []
let choosenCard = -1
let choosenPawn = -1
let playerId 
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
            playerId = body.playerId
            break;
        case "hand":
            hand = body.cards
            showHand()
            break;
        case "pawnsPositions":
            console.log(body)
            pawnsPositions = body
            showBoard()
            break;
        case "gameStarted":
            let s = document.getElementById("start")
            s.parentNode.removeChild(s)
            break;
        case "yourTurn":
            document.getElementById("infos").innerHTML = "Your turn"
            break;
        default:
            console.log(title)
            break;
    }
};

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
    let res = card[1]
    if (card[1] == 1)res = "A"
    if (card[1] == 11)res = "J"
    if (card[1] == 12)res = "Q"
    if (card[1] == 13)res = "K"
    if (card[1] == 14)res = "Joker"
    return res
}

function toColor(num){
    let colors = ["red", "green", "blue", "yellow"]
    return colors[num]
}

function showHand(){
    res = ""
    for (let i = 0; i < hand.length; i++) {
        let card = hand[i]
        res+=`<button onclick="chooseCard(${i})">${toCard(card)}</button>`
    }
    document.getElementById("hand").innerHTML = res
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
                boardMap+=`<div class="boardCell">`
                if (pawnInfos.id != -1){
                    boardMap+=`<button `
                    if (pawnInfos.player == playerId)boardMap+=`onclick="choosePawn(${pawnInfos.id})" style="background-color: ${toColor(pawnInfos.player)}"`
                    boardMap+=`>${id}</button>`
                }
                boardMap+=`</div>`
            }else{
                boardMap+=`<div class="boardEmptyCell"></div>`
            }
        }
    }
    document.getElementById("board").innerHTML = boardMap
    for (let j = 0; j < pawnsPositions[playerId].length; j++) {
        if (pawnsPositions[playerId][j] == -1)document.getElementById("board").innerHTML+=`<button class="pawn" onclick="choosePawn(${j})" >pawn</button>`
    }
}

function start(){
    send("startGame")
}

function chooseCard(i){
    choosenCard = i
    document.getElementById("infos").innerHTML = "Choose a pawn"
    if(choosenPawn !=-1) playCard(choosenCard, choosenPawn)
}

function choosePawn(i){
    choosenPawn = i
    if(choosenCard != -1)playCard(choosenCard, choosenPawn)
}
let action = "move"
function changeAction(n){
    action = n
}

function askAction(cardNb, pawnIndex){
    if (pawnsPositions[playerId][pawnIndex] == -1)action = "enter"
    return action
}

function askJokerOption(){
    return 2;
}

function askExchangeOption(){
    return [0, 0]
}

function playCard(index, pawnIndex, action = "move"){
    option = askAction(hand[index][1], pawnIndex)
    if (hand[index][1] == 14) send("playCard", {cardIndex: index, pawnIndex: pawnIndex, action: action, option: askJokerOption()})
    else if (hand[index][1] == 11) send("playCard", {cardIndex: index, pawnIndex: pawnIndex, action: action, option: askExchangeOption()})
    else send("playCard", {cardIndex: index, pawnIndex: pawnIndex, action: action})
    choosenPawn = -1
    choosenCard = -1
    document.getElementById("infos").innerHTML = "Opponents turns"
}