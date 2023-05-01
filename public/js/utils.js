
function send(title, data = {}){
    ws.send(JSON.stringify({title: title, body: data}))
}