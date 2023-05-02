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
        default:
            console.log(title)
            break;
    }
};

function toCard(card){
    let res = card[1]
    if (card[1] == 1)res = "A"
    if (card[1] == 11)res = "J"
    if (card[1] == 12)res = "Q"
    if (card[1] == 13)res = "K"
    if (card[1] == 14)res = "Joker"
    return res
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
    return id
}

function getPawnOnCell(id){
    let offset = 5
    let pawnIndex = -1
    for (let p = 0; p < pawnsPositions.length; p++) {
        if (pawnsPositions[p].indexOf((id+offset)%cellNb) != -1){
            return pawnsPositions[p].indexOf((id+offset)%cellNb) 
        }
    }
    return pawnIndex
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
                let pawn = getPawnOnCell(id)
                boardMap+=`<button class="boardCell"`
                if (pawn != -1)boardMap+=`onclick="choosePawn(${pawn})" style="background-color: red"`
                boardMap+=`>${id}</button>`
            }else{
                boardMap+=`<div class="boardEmptyCell"></div>`
            }
        }
    }
    document.getElementById("board").innerHTML = boardMap
    for (let j = 0; j < pawnsPositions[playerId].length; j++) {
        document.getElementById("board").innerHTML+=`<button class="pawn" onclick="choosePawn(${j})" >pawn pos : ${pawnsPositions[playerId][j]}</button>`
    }
}

function start(){
    send("startGame")
    let s = document.getElementById("start")
    s.parentNode.removeChild(s)
}

function chooseCard(i){
    choosenCard = i
    document.getElementById("hand").innerHTML = "choose a pawn"
    if(choosenPawn !=-1) playCard(choosenCard, choosenPawn)
}

function choosePawn(i){
    choosenPawn = i
    if(choosenCard != -1)playCard(choosenCard, choosenPawn)
}

function playCard(index, pawnIndex, option = 0){
    if (pawnsPositions[playerId][pawnIndex] == -1)option = 1
    send("playCard", {cardIndex: index, pawnIndex: pawnIndex, option: option})
    choosenPawn = -1
    choosenCard = -1
}