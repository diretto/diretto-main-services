var url = require('url');
var util = require('util');
var path = require('path');

/**
 * A dummy Basic Authentication
 * 
 * Allows all requests where the username equals the password.
 * 
 * @author Benjamin Erb
 */
exports.Plugin = {

	version : "0.1.0",

	author : "Benjamin Erb",

	name : "Dummy Basic Authentication",

	id : "auth-basic-dummy",

	init : function(options) {
		console.log("Initializing " + this.name);
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
				else {
					if (userid === password) {
						callback(null, userid);
					}
					else {
						callback({
							"code" : 401,
							"reason" : "Invalid credentials"
						});
					}
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