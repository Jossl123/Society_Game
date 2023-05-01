var ws = new WebSocket(`ws:${window.location.host}/tijou`, "protocolOne");
ws.onopen = (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("roomId");
    send("join", {game: "tijou", roomId: roomId})
};

ws.onmessage = (event) => {
    let data = JSON.parse(event.data)
    let title = data.title
    let body = data.body
    switch (title) {
        case "rooms":
            showRooms(body)
            break;
        case "error":
            break;
        case "roomCreated":
            window.location.replace(`${window.location.href}?roomId=${body.roomId}`);
            break;
        default:
            console.log(title)
            break;
    }
};

function joinRoom(roomId){
    send("join", {roomId: roomId})
}

function createRoom(){
    send("createRoom")
}

function showRooms(rooms){
    let roomsDiv = document.getElementById("rooms")
    if (rooms.length == 0)roomsDiv.innerHTML += "no rooms"
    rooms.forEach(room => {
        roomsDiv.innerHTML += `<div>${room}<button onclick="joinRoom(${room})">join</button></div>`
    });
}

function send(title, data = {}){
    ws.send(JSON.stringify({title: title, body: data}))
}

function roomJoined(roomId){
    document.getElementsByTagName("body")[0].innerHTML = "game " + roomId
}

function start(){
    send("startGame")
}