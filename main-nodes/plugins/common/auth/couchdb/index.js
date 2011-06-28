var url = require('url');
var util = require('util');
var path = require('path');

require.paths.unshift(path.join(__dirname, 'lib'));

var Pool = require('pool').Pool;
var Cache = require('cache').Cache;

/**
 * A Basic Authentication plugin backed by CouchDB
 * 
 * @author Benjamin Erb
 */
exports.Plugin = {

	version : "0.1.0",

	author : "Benjamin Erb",

	name : "CouchDB-backed Basic Authentication",

	id : "auth-basic-couchdb",

	init : function(options) {
		console.log("Initializing " + this.name);
		this.pool = new Pool(options.couchdb.host || "127.0.0.1", options.couchdb.port || 5984, {
			poolsize : options.couchdb.poolsize || 4
		});
		this.db = options.couchdb.database || "users";

		// Check if database exists and create if not
		var that = this;
		this.pool.dispatchRequest("HEAD", path.join("/", this.db), {}, function(request) {
			request.once('response', function(response) {
				if (response.statusCode === 404) {
					that.pool.dispatchRequest("PUT", path.join("/", that.db), {}, function(createRequest) {
						createRequest.end();
					});
				}
			});
			request.end();
		});

		this.cache = new Cache(options.cache.size || 1000, options.cache.lease || (120 * 1000));
	},

	authenticate : function(request, callback) {
		if (!request.headers['authorization']) {
			callback({
				"code" : 401,
				"reason" : "Authentication is missing"
			});
		}
		else {
			var headerValue = request.headers['authorization'];
			var value;
			if (value = headerValue.match("^Basic\\s([A-Za-z0-9+/=]+)$")) {
				var auth = (new Buffer(value[1] || "", "base64")).toString("ascii");
				var userid = auth.slice(0, auth.indexOf(':'));
				var password = auth.slice(auth.indexOf(':') + 1, auth.length);

				if (!userid || !password || userid.length <= 1 || password.length <= 1) {
					callback({
						"code" : 401,
						"reason" : "Invalid credentials"
					});
					return;
				}

				var cachedPw = this.cache.get(userid);
				if (this.cache.get(userid) === password) {
					callback(null, userid);
				}
				else {
					var that = this;
					that.pool.dispatchRequest("GET", path.join("/", that.db, userid), {}, function(request) {
						request.end();
						request.once('response', function(response) {
							if (response.statusCode === 200) {
								var b = "";
								response.on('data', function(c) {
									b = b + c;
								});
								response.on('end', function() {
									try {
										var result = JSON.parse(b);
										if (result.password && result.password === password) {
											callback(null, userid);
											that.cache.put(userid, result.password);
										}
										else {
											callback({
												"code" : 401,
												"reason" : "Invalid credentials"
											});
										}
									}
									catch (e) {
										callback({
											"code" : 500,
											"reason" : "Internal error"
										});
									}
								});
							}
							else {
								console.log("opps");
								callback({
									"code" : 401,
									"reason" : "Invalid credentials"
								});
							}
						});
					});
				}
			}
			else {
				callback({
					"code" : 401,
					"reason" : "Wrong authentication schema"
				});
			}
		}
	}
};