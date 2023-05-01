

function send(ws, title, body = {}){
    ws.send(JSON.stringify({title: title, body: body}))
}

module.exports = send