var crypto = require('crypto');

module.exports = function(salt) {

	var DELIMITER = ":";

	var signRequest = function(method, username, path, length, mimetype, callback) {
		var s = method + DELIMITER + username + DELIMITER + path + DELIMITER + length + DELIMITER + mimetype;
		var hmac = crypto.createHmac("sha1", salt);
		hmac.update(s);
		var result = hmac.digest('hex');
		callback(null, result);
	};

	var signResponse = function(statuscode, username, path, callback) {
		var hmac = crypto.createHmac("sha1", salt);
		hmac.update(statuscode + DELIMITER + username + DELIMITER + path);
		var result = hmac.digest('hex');
		callback(null, result);
	};

	return {
		signRequest : signRequest,
		signResponse : signResponse
	};
};