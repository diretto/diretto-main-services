/**
 * Takes an array of service endpoint URIs and tries to validate them: - check
 * URI - check version - check corresponding core service
 * 
 * All valid services will be gathered an returned as an array to the callback.
 */

var http = require('http');
var url = require('url');
var barrierpoints = require('barrierpoints');

module.exports = function(services, callback) {

	//TODO: extend list
	var supportedAPIs = {
		"org.diretto.api.external.task" : {
			"v2" : true
		}
	};

	var validatedURIs = [];

	var b = barrierpoints(services.length, function() {
		callback(validatedURIs)
	});

	services.forEach(function(uri) {

		// check uri
		if (uri.indexOf("http://") === -1 && uri.indexOf("https://") === -1) {
			b.submit();
			return;
		}

		var uriParts = url.parse(uri);

		var options = {
			host : uriParts.hostname,
			port : uriParts.port || 80,
			path : uriParts.pathname || "/",
			headers : {
				"Accept" : "application/json"
			}
		};

		// get index page
		http.get(options, function(res) {
			res.setEncoding('utf8');
			var r = "";
			res.on('data', function(c) {
				r = r + c;
			});
			res.once('end', function() {
				if (res.statusCode === 200) {
					try {
						var j = JSON.parse(r);

						if (j && j.api && j.api.name && j.api.version) {
							if (supportedAPIs[j.api.name] && supportedAPIs[j.api.name][j.api.version]) {

								// TODO: Are we fetching ourself? Then skip... 
								// TODO: is it addressing the correct Core API ("us")?

								validatedURIs.push({
									api : {
										name : j.api.name,
										version : j.api.version
									},
									service : {
										name : j.service.name || "",
										version : j.service.version || ""
									},
									deployment : {
										title : j.deployment.title || "",
										contact : j.deployment.contact || "",
										website : {
											link : {
												rel : "self",
												href : j.deployment.website.link.href || ""
											}
										}
									},
									link : {
										"rel" : "self",
										"href" : uri
									}

								});
							}
						}
					}
					catch (e) {
					}
				}
				b.submit();
			});

		}).on('error', function(e) {
			b.submit();
			return;
		});
	});

}
