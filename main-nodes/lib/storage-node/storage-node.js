var http = require('http');
var path = require('path');


var PluginHandler = require('plugin-handler').PluginHandler;

var Signer = require('signer');

module.exports = function(options) {
	
	var server = http.createServer();

	var plugin = new PluginHandler();
	
	// Load auth plugin
	var auth = null;
	var auths = plugin.preloadAllPluginsSync(path.join(__dirname,  '..', '..', 'plugins', 'common', 'auth'), true);
	if (auths[options.storage.auth.plugin]) {
		auth = auths[options.storage.auth.plugin]();
	}
	if (auth === null) {
		console.error("Could not initialize authentication plugin \"" + options.storage.auth.plugin + "\"");
		process.exit(-1);
	}
	
	// Load backend plugin
	var backend = null;
	var backends = plugin.preloadAllPluginsSync(path.join(__dirname, '..', '..', 'plugins', 'storage-node', 'storage-backend'), true);
	if (backends[options.storage.storage.backend]) {
		backend = backends[options.storage.storage.backend]();
	}
	if (this.backend === null) {
		console.error("Could not initialize storage backend \"" + this.options.storage.storage.backend + "\"");
		process.exit(-1);
	}
	
	var signer = Signer(options.common.security.salt);
	
	signer.signResponse(1,2,3, function(err, token){
		console.log(token);	
	});
	
	return {

		bind : function() {
			server.listen(options.storage.bind.port || 8000, options.storage.bind.ip || "127.0.0.1");
		}

	};
};