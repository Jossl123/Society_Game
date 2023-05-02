var ws = new WebSocket(`ws:${window.location.host}/tijou`, "protocolOne");
ws.onopen = (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("roomId");
    send("join", {roomId: roomId})
};

let hand = []
let board = []
let choosenCard = -1
let choosenPawn = -1
let id 
ws.onmessage = (event) => {
    let data = JSON.parse(event.data)
    let title = data.title
    let body = data.body
    switch (title) {
        case "error":
            console.log("Error : " + body)
            break;
        case "playerId": 
            id = body.playerId
            break;
        case "hand":
            hand = body.cards
            showHand()
            break;
        case "board":
            console.log(body)
            board = body
            showBoard()
            break;
        default:
            console.log(title)
            break;
    }
};

function toCard(card){
    let res = card[1]
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

function showBoard(){
    let boardMap = ""
    let offset = 6
    for (let i = offset; i < 38+offset; i++) {
        let pos = i%38
        let pawnOnCell = false
        let pawnIndex = -1
        for (let p = 0; p < board.length; p++) {
            if (board[p].indexOf(pos) != -1){
                pawnOnCell = true
                pawnIndex = board[p].indexOf(pos) 
            }
        }
        if (pos-offset>10 && pos<29+offset && pos%2 == 1)for (let j = 0; j < 8; j++) {
            boardMap+=`<div class="boardEmptyCell"></div>`
        }

        boardMap+=`<button class="boardCell"`
        if (pawnOnCell)boardMap+=`onclick="choosePawn(${pawnIndex})" style="background-color: red"`
        boardMap+=`>cell</button>`
    }
    document.getElementById("board").innerHTML = boardMap
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            document.getElementById("board").innerHTML+=`<button class="pawn" onclick="choosePawn(${j})" >pawn pos : ${board[i][j]}</button>`
        }
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
}

function choosePawn(i){
    choosenPawn = i
    playCard(choosenCard, choosenPawn)
}

function playCard(index, pawnIndex, option = 0){
    document.getElementById("hand").innerHTML = "choose a pawn"
    if (board[id][pawnIndex] == -1)option = 1
    send("playCard", {cardIndex: index, pawnIndex: pawnIndex, option: option})
}