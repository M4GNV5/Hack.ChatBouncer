var http = require("http");
var request = require("request");

module.exports = function(config, channel)
{
    http.createServer(function (req, res)
    {
    	if(req.url.substr(0, 2) == "/?" && config.redirect && typeof channel[req.url.substr(2)] != 'object')
    	{
            var serverUrl = config.server + req.url;
            res.writeHead(302, { "Location": serverUrl });
            res.end();
    	}

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
}
