var request = require("request");
var WebSocket = require("ws");
var http = require("http");
var config = require("./config.json");

var channel = {};
var received = {};

for(var i = 0; i < config.channel.length; i++)
{
	_addChannel(i);
}

function _addChannel(i)
{
	var name = config.channel[i];
	setTimeout(function() //rate limit <3
	{
		channel[name] = addChannel(name);
	}, 5000 * i + 1);
}

function addChannel(channel)
{
	var bouncer = {};
	bouncer.ws = new WebSocket(config.url);
	bouncer.received = [];
	bouncer.connected = false;

	bouncer.ws.on("open", function()
	{
		var message = {cmd: "join", channel: channel, nick: config.nick};
		bouncer.ws.send(JSON.stringify(message));
		console.log("Connected to ?" + channel);
	});

	bouncer.ws.on("message", function(data)
	{
		if(bouncer.connected)
		{
			bouncer.client.send(data);
		}

		bouncer.received.push(data);
	});

	return bouncer;
}

var server = new WebSocket.Server({ port: 6060 });
server.on("connection", function(socket)
{
	socket.on("message", function(data)
	{
		try
		{
			var _data = JSON.parse(data);
			if(_data.cmd == "join" && _data.nick == config.password)
			{
				var _channel = channel[_data.channel];

				if(!_channel)
				{
					socket.send(JSON.stringify({cmd: "warn", text: "Bouncer not connected to channel ?" + _data.channel}));
					return;
				}
				if(_channel.connected)
				{
					socket.send(JSON.stringify({cmd: "warn", text: "Already bouncing that channel"}));
					return;
				}

				_channel.connected = true;
				_channel.client = socket;

				for(var i = 0; i < _channel.received.length; i++)
				{
					socket.send(_channel.received[i]);
				}

				socket.on("message", function(data)
				{
					_channel.ws.send(data);
				});

				socket.channel = _channel;

				console.log(socket.upgradeReq.connection.remoteAddress + " bounced in ?" + _data.channel);
			}
		}
		catch(e)
		{
			console.log(e.toString());
		}
	});
	socket.on("close", function()
	{
		if(!socket.channel)
			return;

		socket.channel.connected = false;
		delete socket.channel.client;
	});
});

http.createServer(function (req, res)
{
	request(config.server + req.url, function(err, response, body)
	{
		if(err)
		{
			res.writeHead(500);
			res.end(err.toString());
			return;
		}

		res.end(body);
	});
}).listen(config.httpPort, '0.0.0.0');
