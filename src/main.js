var WebSocket = require("ws");
var config = require("./config.json");

var handleClient = require("./handleClient.js");
var addChannel = require("./handleChannel.js");

var channel = {};

for(var i = 0; i < config.channel.length; i++)
{
	(function(i)
	{
		var name = config.channel[i];
		setTimeout(function() //rate limit <3
		{
			channel[name] = addChannel(config, name);
		}, 20000 * i + 1);
	})(i);
}

var server = new WebSocket.Server({ port: 6060 });
server.on("connection", function(socket)
{
	handleClient(socket, channel, config);
});

require("./httpProxy.js")(config, channel);
