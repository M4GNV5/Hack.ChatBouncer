var WebSocket = require("ws");

module.exports = function(config, name)
{
	var bouncer = {};
    bouncer.channel = name;
	bouncer.ws = new WebSocket(config.url);
	bouncer.received = [];
	bouncer.connected = false;
	bouncer.userList = [];

    setupClient(config, bouncer);

	return bouncer;
}

function setupClient(config, bouncer)
{
    bouncer.ws.on("open", function()
	{
		var message = {cmd: "join", channel: bouncer.channel, nick: config.nick};
		bouncer.ws.send(JSON.stringify(message));
		console.log("Connected to ?" + bouncer.channel);
	});

	bouncer.ws.on("message", function(data)
	{
		try
		{
			if(bouncer.connected)
				bouncer.client.send(data);

			var _data = JSON.parse(data);

			if(_data.cmd != "onlineSet")
				bouncer.received.push(data);

			if(_data.cmd == "onlineSet")
				bouncer.userList = _data.nicks;
			else if(_data.cmd == "onlineAdd")
				bouncer.userList.push(_data.nick);
			else if(_data.cmd == "onlineRemove")
				bouncer.userList.splice(bouncer.userList.indexOf(_data.nick), 1);
		}
		catch(e)
		{
			console.log("Error parsing message from server: " + data);
		}
	});

    var pingInterval = setInterval(function()
    {
        bouncer.ws.send(JSON.stringify({cmd: "ping"}));
    }, 60000);

    bouncer.ws.on("close", function()
    {
        clearInterval(pingInterval);

		console.log("Disconnected from ?" + bouncer.channel);
        var warn = {cmd: "warn", text: "Bouncer disconnected! Attempting to reconnect..."};
        bouncer.received.push(warn.toString());
        bouncer.ws = new WebSocket(bouncer.ws.url);
        setupClient(config, bouncer);
    });
}
