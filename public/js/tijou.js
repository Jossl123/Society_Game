var ws = new WebSocket(`ws:${window.location.host}/tijou`, "protocolOne");
ws.onopen = (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("roomId");
    send("join", {roomId: roomId})
};

let hand = []
ws.onmessage = (event) => {
    let data = JSON.parse(event.data)
    let title = data.title
    let body = data.body
    switch (title) {
        case "error":
            console.log("Error : " + body)
            break;
        case "hand":
            hand = body.cards
            showHand()
            break;
        case "positions":
            console.log(body);
            break;
        default:
            console.log(title)
            break;
    }
};

function showHand(){
    res = ""
    hand.forEach(card=>{
        res+=card[1] + ","
    })
    document.getElementById("hand").innerHTML = res
}

function start(){
    send("startGame")
    let s = document.getElementById("start")
    s.parentNode.removeChild(s)
}

function playCard(index, pawnIndex = 0, option = 0){
    send("playCard", {cardIndex: index, pawnIndex: pawnIndex, option: option})
}