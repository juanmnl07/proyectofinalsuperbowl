var request = require('request'),
    express = require('express'),
    bodyParser  = require("body-parser"),
    methodOverride = require("method-override");
    
app = express(),
server = require('http').createServer(app),
io = require("socket.io").listen(server),
nicknames = {};

//Dabatabase
//var mongo = require('mongodb');
//var monk = require('monk');
//var db = monk('localhost:27017/nodetest1');

// conexion con MongoDB
var mongo = require('mongodb').MongoClient,
    client = require('socket.io').listen(8000).sockets;

client.on('connection', function(socket) {
    
    mongo.connect('mongodb://localhost/chat', function(err, db) {
        if(err) throw err;

        var col = db.collection('messages');

        col.find().limit(100).sort({_id: 1}).toArray(function(err, res) {
            if(err) throw err;
            socket.emit('output', res);
        });
       
        socket.on('input', function(data) {
            col.insert({name: data.name, message: data.message}, function(err, docs) {
                client.emit('output', [data]);
            });
        });
    });
});

server.listen(8000);

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});

app.get('/flowplayer.min.js', function(req, res) {
    res.sendfile(__dirname + '/flowplayer.min.js');
});

io.sockets.on('connection', function(socket) {
    socket.on('send message to eliza', function(data) {
        var strArray = data.split(':');
        var strArrayMessage = strArray[1].split('-');
        var message = strArrayMessage[0];
        var fullMessage = strArray[0]+":"+strArrayMessage[0];
        io.sockets.emit('new message', {msg: fullMessage, nick: socket.nickname});
        //separar data
        if(strArrayMessage[1] == 'eliza'){
            request({
                url: "http://www.botlibre.com/rest/botlibre/form-chat?application=7937626380781354139&instance=857180&message="+message,
                method: "GET",
            }, function (error, response, body){
                io.sockets.emit('new message', {msg: response.body, nick: '@Eliza'});
            });
        }
    });

    socket.on('send message', function(data) {

	var newMsg = new Chat({msg: msg, nick: socket.nickname});
			newMsg.save(function(err){
				if(err) throw err;
       io.sockets.emit('new message', {msg: data, nick: socket.nickname}); 
    });
    
    socket.on('new user', function(data, callback) {
        if (data in nicknames) {
            callback(false);
        } else {
            callback(true);
            socket.nickname = data;
            nicknames[socket.nickname] = 1;
            updateNickNames();
        }
    });
    
    socket.on('disconnect', function(data) {
        if(!socket.nickname) return;
        delete nicknames[socket.nickname];
        updateNickNames();
    });
    
    function updateNickNames() {
        io.sockets.emit('usernames', nicknames);
    }
});