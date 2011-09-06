/**
 * Index Handler
 *
 * @author Benjamin Erb
 */
module.exports = function(h) {

	//create JSON once, only static usage
	var index = {
		"api" : {
			"name" : "org.diretto.api.main.core",
			"version" : "v2"
		},
		"service" : {
			"name" : h.options.server.name,
			"version" : h.options.server.version
		},
		"deployment" : {
			"title" : h.options.core.deployment.title || "unnamed",
			"contact" : h.options.core.deployment.contact || "n/a",
			"website" : {
				"link" : {
					"rel" : "self",
					"href" : h.options.core.deployment.website || "n/a"
				}
			}
		},
		"links" : [ {
			"title" : "diretto Core API Documentation",
			"link" : {
				"rel" : "self",
				"href" : "http://diretto.github.com/diretto-api-doc/v2/diretto/core.html"
			}
		},{
			"title" : "Documents Collection Resource",
			"link" : {
				"rel" : "self",
				"href" : h.util.uri.documents()
			}
		},{
			"title" : "Links Collection Resource",
			"link" : {
				"rel" : "self",
				"href" : h.util.uri.links()
			}
		},{
			"title" : "Tags Collection Resource",
			"link" : {
				"rel" : "self",
				"href" : h.util.uri.basetags()
			}
		},{
			"title" : "User Collection Resource",
			"link" : {
				"rel" : "self",
				"href" : h.util.uri.users()
			}
		},{
			"title" : "Query Resource",
			"link" : {
				"rel" : "self",
				"href" : h.util.uri.queryDispatch()
			}
		},{
			"title" : "Service Registry",
			"link" : {
				"rel" : "self",
				"href" : h.util.uri.serviceRegistry()
			}
		}],
		"parameters" : {
			"paginationSize" : h.options.core.parameters.paginationSize || 20,
			"batchLimit" : h.options.core.parameters.batchLimit || 50
		}
	};

	return {

		get : function(req, res, next) {
			res.send(200, index);
			return next();
		}

	};
};