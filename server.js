const express = require('express')
const app = express();
const http = require('http').Server(app);

app.use(express.json())
app.use(express.static(__dirname + '/public/'));

app.get("/", (req, res) =>  {
    return res.sendFile(__dirname + '/views/index.html')
})

app.get("/shifumi", (req, res) =>  {
    return res.sendFile(__dirname + '/views/shifumi.html')
})

app.use(function(req, res, next) {
    res.status(404).sendFile(__dirname + '/views/errors/404.html');
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});