var WebSocket = require("ws");

module.exports = function(config, name)
{
	var bouncer = {};
    bouncer.channel = name;
	bouncer.ws = new WebSocket(config.url);
	bouncer.received = [];
	bouncer.connected = false;

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
		if(bouncer.connected)
		{
			bouncer.client.send(data);
		}

		bouncer.received.push(data);
	});

    var pingInterval = setInterval(function()
    {
        bouncer.ws.send(JSON.stringify({cmd: "ping"}));
    }, 60000);

    bouncer.ws.on("close", function()
    {
        clearInterval(pingInterval);

        var warn = {cmd: "warn", text: "Bouncer disconnected! Attempting to reconnect..."};
        bouncer.received.push(warn.toString());
        bouncer.ws = new WebSocket(bouncer.ws.url);
        setupClient(config, bouncer);
    });
}
