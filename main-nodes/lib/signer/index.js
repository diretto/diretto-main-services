var crypto = require('crypto');

/**
 * Simple HMAC calculation that signs incoming uploads and 
 * upload verification responses. Used for communication-less
 * agreement between Core API node and Storage API node.
 * 
 * Note that both instances must be configured to use the same salt.
 * 
 * @author Benjamin Erb
 */
module.exports = function(salt) {

	var DELIMITER = ":";

	var signRequest = function(method, username, path, length, mimetype, callback) {
		var s = method + DELIMITER + username + DELIMITER + path + DELIMITER + length + DELIMITER + mimetype;
		var hmac = crypto.createHmac("sha1", salt);
		hmac.update(s);
		var result = hmac.digest('hex');
		//use a callback, maybe this will be replaced in the future with a more async func
		callback(null, result);
	};

	var signResponse = function(statuscode, username, path, callback) {
		var hmac = crypto.createHmac("sha1", salt);
		hmac.update(statuscode + DELIMITER + username + DELIMITER + path);
		var result = hmac.digest('hex');
		//use a callback, maybe this will be replaced in the future with a more async func
		callback(null, result);
	};

	return {
		signRequest : signRequest,
		signResponse : signResponse
	};
};