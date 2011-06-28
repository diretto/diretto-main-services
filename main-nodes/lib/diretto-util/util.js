var fs = require('fs');

/**
 * Converts a CouchDB style UUID into RFC-style UUID.
 * 
 * @param s
 *            UUID
 */
exports.toUUID = function(s) {
	if (s.length === 32) {
		return s.substr(0, 8) + "-" + s.substr(8, 4) + "-" + s.substr(12, 4) + "-" + s.substr(16, 4) + "-" + s.substr(20, 12);
	}
	else {
		return s;
	}
};

/**
 * Reads in a JSON config file sync. and returns it as a java script object
 * literal.
 * 
 * @param filePath
 */
exports.readConfigFileSync = function(filePath) {
	try {
		var confRaw = fs.readFileSync(filePath, 'utf8');
		config = JSON.parse(confRaw);
		return config;
	}
	catch (e) {
		console.warn("Could not parse config file "+filePath+". Reason: "+ e);
		return {};
	}
};

/**
 * Mixes the first object with the other objects provided as parameter.
 * 
 * @param target
 * @param objects to mix in from
 */
exports.mixin = function(target) {
	var args = Array.prototype.slice.call(arguments, 1);

	args.forEach(function(a) {
		var keys = Object.keys(a);
		for ( var i = 0; i < keys.length; i++) {
			target[keys[i]] = a[keys[i]];
		}
	});
	return target;
};