/**
 * Simple HMAC calculation that signs incoming uploads and 
 * upload verification responses. Used for communication-less
 * agreement between Core API node and Storage API node.
 * 
 * Note that both instances must be configured to use the same salt.
 * 
 * @author Benjamin Erb
 */

var crypto = require('crypto');

module.exports = function(salt) {

	var DELIMITER = ":";

	var signRequest = function(username, path, length, mimetype, callback) {
		var s = username + DELIMITER + path + DELIMITER + length + DELIMITER + mimetype;
		console.log(s);
		var hmac = crypto.createHmac("sha1", salt);
		hmac.update(s);
		var result = hmac.digest('hex');
		//use a callback, this may replaced with a more async func in the future 
		callback(null, result);
	};

	var signResponse = function(statuscode, username, path, callback) {
		var hmac = crypto.createHmac("sha1", salt);
		hmac.update(statuscode + DELIMITER + username + DELIMITER + path);
		var result = hmac.digest('hex');
		//use a callback, this may replaced with a more async func in the future 
		callback(null, result);
	};

	return {
		signRequest : signRequest,
		signResponse : signResponse
	};
};