module.exports = function(socket, channel, config)
{
    socket.on("message", function(data)
	{
        var _data;
        try
        {
            _data = JSON.parse(data);
        }
        catch(e)
        {
            return;
        }

		if(_data.cmd == "join")
		{
			if(_data.nick != config.password)
			{
				socket.send(JSON.stringify({cmd: "warn", text: "Invalid password! Enter your password as username!"}));
				return;
			}

			var _channel = channel[_data.channel];

			if(!_channel)
			{
				var text = "Bouncer not connected to channel ?" + _data.channel +
					"\nYou can join directly on " + config.server + "/?" + _data.channel;
				socket.send(JSON.stringify({cmd: "warn", text: text}));
				return;
			}
			if(_channel.connected)
			{
				var text = _channel.client.upgradeReq.connection.remoteAddress + " is already bouncing that channel";
				socket.send(JSON.stringify({cmd: "warn", text: text}));
				return;
			}

			_channel.connected = true;
			_channel.client = socket;

			for(var i = 0; i < _channel.received.length; i++)
			{
				socket.send(_channel.received[i]);
			}

            if(config.cacheCount > 0)
                _channel.received.splice(config.cacheCount);

			socket.on("message", function(data)
			{
				_channel.ws.send(data);
			});

			socket.channel = _channel;

			console.log(socket.upgradeReq.connection.remoteAddress + " bounced in ?" + _data.channel);
		}
	});
	socket.on("close", function()
	{
		if(!socket.channel)
			return;

		socket.channel.connected = false;
		delete socket.channel.client;
	});
};
