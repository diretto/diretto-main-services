var http = require("http");
/**
 * HTTP Client connection pooling 
 * 
 * @author Benjamin Erb
 */

this.Pool = function(host, port, options) {
	var that = this;

	this.options = options;
	this.host = host;
	this.port = port;

	// a free list of clients in the pool
	this.clients = [];

	// a queue of requests waiting for available clients
	this.queue = [];

	this.poolsize = options.poolsize || 32;

	for ( var x = 0; x < this.poolsize; x++) {
		var c = http.createClient(this.port, this.host);
		c.setTimeout(options.timeout || 0);
		this.clients.push(c);
		
		//TODO: delete me
		c.on('error', function(err){
			console.log("client err "+ err);
		});
	}

};

this.Pool.prototype = {

	dispatchRequest : function(method, path, headers, requestCallback) {
		var that = this;

		var acquireClient = function(client) {
			headers["Connection"] = "Keep-Alive";
			if(!headers["Host"]){
				headers["Host"] = that.host+":"+that.port;
			}
			request = client.request(method.toUpperCase(), path, headers);
			
			//TODO: delete me
			request.on('error', function(err){
				console.log("request err "+ err);
			});
			
			request.once('response', function(response) {
				response.once('end', function() {
					// release client
					var q = that.queue.pop();
					if (q) {
						// execute next request from queue...
						q(response.client);
					}
					else {
						// ...or enqueue to free workers
						that.clients.unshift(response.client);

					}
				});
			});
			requestCallback(request);
		};

		var client = this.clients.pop();
		if (client) {
			// execute directly...
			acquireClient(client);
		}
		else {
			// ...or enqueue
			that.queue.unshift(function(client) {
				acquireClient(client);
			});
		}
	}

};