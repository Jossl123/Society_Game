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

function showHand(){
    res = ""
    for (let i = 0; i < hand.length; i++) {
        let card = hand[i]
        res+=`<button class="card" style="transform: rotate(${i*10}deg)" onclick="chooseCard(${i})"><img src="./img/playing_cards/${toCard(card)}.png"></img></button>`
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
                    if (pawnInfos.player == playerId)boardMap+=`onclick="choosePawn(${pawnInfos.id}, ${pawnInfos.player})" style="background-color: ${toColor(pawnInfos.player)}"`
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
}

function choosePawn(i,playerId){
    if(choosenCard != -1){
        if(hand[choosenCard][1]==11){
            if (choosenPawn==-1)choosenPawn = i
            else {
                jOption.playerId = playerId
                jOption.pawnIndex = i
                playCard(choosenCard, choosenPawn, "exchange")
            }
            return
        }
        choosenPawn = i
        if (hand[choosenCard][1] == 14){
            document.getElementById("choices").style.visibility = "visible"
        }else playCard(choosenCard, choosenPawn, action)
    }
}

let jokerOption = 2
let jOption = {playerId: -1, pawnIndex: -1}
function changeOption(o){
    jokerOption = o
    if(choosenCard != -1 && choosenPawn != -1)playCard(choosenCard, choosenPawn, action)
    document.getElementById("choices").style.visibility = "hidden"
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
    return jokerOption;
}

function askExchangeOption(){
    console.log(jOption)
    return jOption
}

function playCard(index, pawnIndex){
    option = askAction(hand[index][1], pawnIndex)
    if (hand[index][1] == 14) send("playCard", {cardIndex: index, pawnIndex: pawnIndex, action: action, option: askJokerOption()})
    else if (hand[index][1] == 11) send("playCard", {cardIndex: index, pawnIndex: pawnIndex, action: action, option: askExchangeOption()})
    else send("playCard", {cardIndex: index, pawnIndex: pawnIndex, action: action})
    choosenPawn = -1
    choosenCard = -1
    document.getElementById("infos").innerHTML = "Opponents turns"
}