var ws = new WebSocket(`ws:${window.location.host}/rooms`, "protocolOne");
ws.onmessage = (event) => {
    let data = JSON.parse(event.data)
    let title = data.title
    let body = data.body
    console.log(title)
    switch (title) {
        case "rooms":
            showRooms(body)
            break;
        case "error":
            break;
        case "roomCreated":
            joinRoom(body.roomId)
            break;
        default:
            break;
    }
};

function joinRoom(roomId){
    window.location.replace(`http://${window.location.host}/play?roomId=${roomId}`)
}

function createRoom(){
    send("createRoom", {gameType: "tijou"})
}

function showRooms(rooms){
    let roomsDiv = document.getElementById("rooms")
    if (rooms.length == 0)roomsDiv.innerHTML += "no rooms"
    rooms.forEach(roomId => {
        roomsDiv.innerHTML += `<div>${roomId}<button onclick="joinRoom('${roomId}')">join</button></div>`
    });
}
