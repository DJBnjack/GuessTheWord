var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , url= require('url')

app.listen(80);

var words = [ 'APPEL', 'LEVEN','PAARS','GROEN','BLAUW'];
var players = {};
var currentWord = getNewWord();

function handler (req, res) {
  var pathname = url.parse(req.url).pathname;
  console.log('Routing: ',pathname);
  
  if (pathname == '/') pathname = '/index.html';
  
  fs.readFile(__dirname + pathname,
	function (err, data) {
		if (err) {
			console.log('Failed to find:',pathname);
			res.writeHead(500);
			return res.end('Error loading index.html');
		}
		console.log('Found: ',pathname);
		
		if (pathname.substr(pathname.length-2) == "js")
			res.writeHead(200, { 'Content-Type': 'application/javascript' });
		else
			res.writeHead(200);
			
		res.end(data);
	});
}

function getNewWord()
{
	return words[Math.floor((Math.random()*words.length))];
}


io.sockets.on('connection', function (socket) {
	var name = '';
	socket.on('set nickname', function (player_name) {
		name = player_name;
		players[name] = 1;
		socket.emit('hint',currentWord.charAt(0)+"****"); 
		io.sockets.emit('players',players);
		console.log('Registered',name);
	});

	socket.on('guess', function (guess) {
		console.log('Guess',guess,'by',name);
		
		var retString = '';
		for (var i = 0; i < currentWord.length; i++)
		{
			if (currentWord.charAt(i) == guess.charAt(i))
				retString += '0';
			else if (currentWord.indexOf(guess.charAt(i))>0)
				retString += '1';
			else
				retString += '2';
		}
		socket.emit('result',{guess : guess, result : retString});
		
		if (retString == '00000') 
		{
			io.sockets.emit('guessed',name);
			currentWord = getNewWord();
			setTimeout(function() {io.sockets.emit('hint',currentWord.charAt(0)+'****')},5000);
		}
	});
	
	socket.on('disconnect', function (socket) {
		delete players[name];
		io.sockets.emit('players',players);
	});
});