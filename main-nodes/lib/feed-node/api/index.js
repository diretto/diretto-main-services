/**
 * Index Handler
 *
 * @author Benjamin Erb
 */
module.exports = function(h) {

	//create JSON once, only static usage
	var index = {
		"api" : {
			"name" : "org.diretto.api.main.feed",
			"version" : "v2"
		},
		"service" : {
			"name" : h.options.server.name,
			"version" : h.options.server.version
		},
		"deployment" : {
			"title" : h.options.feed.deployment.title || "unnamed",
			"contact" : h.options.feed.deployment.contact || "n/a",
			"website" : {
				"link" : {
					"rel" : "self",
					"href" : h.options.feed.deployment.website || "n/a"
				}
			}
		},
		"parameters" : {
			"paginationSize" : h.options.feed.parameters.paginationSize || 20,
		}
	};

	return {

		get : function(req, res, next) {
			res.send(200, index);
			return next();
		}

	};
};