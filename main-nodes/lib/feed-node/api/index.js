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
		"links" : [ {
			"title" : "diretto Feed API Documentation",
			"link" : {
				"rel" : "self",
				"href" : "http://diretto.github.com/diretto-api-doc/v2/diretto/feed.html"
			}
		},{
			"title" : "Atom feed of published documents",
			"link" : {
				"rel" : "self",
				"href" : h.util.uri.documentsFeed()
			}
		},{
			"title" : "Atom feed of published comments",
			"link" : {
				"rel" : "self",
				"href" : h.util.uri.commentsFeed()
			}
		},{
			"title" : "Atom feed of published attachments",
			"link" : {
				"rel" : "self",
				"href" : h.util.uri.attachmentsFeed()
			}
		},{
			"title" : "Atom feed of published documents of a distinct media type",
			"link" : {
				"rel" : "self",
				"href" : h.util.uri.mediaFeed("{type}")
			}
		},{
			"title" : "Atom feed of resources related to a distinct document",
			"link" : {
				"rel" : "self",
				"href" : h.util.uri.documentDetailsFeed("{id}")
			}
		}],
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