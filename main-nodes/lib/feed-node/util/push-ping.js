/**
 * A wrapper that consumes _changes events and pings the hub.
 * 
 * @author Benjamin Erb
 * 
 */

var querystring = require('querystring');
var request = require('request')

module.exports = function(h, eventEmitter) {

	var pingHub = function(feedUri) {
		
		console.log("Pinging "+feedUri+"...");
		
		var body = querystring.stringify( {
			'hub.mode' : "publish",
			"hub.url" : feedUri
		});
		
		request({
			"method" : "POST",
			"uri" : h.options.feed.hub.uri,
			"headers" : {
				"Content-Type" : "application/x-www-form-urlencoded",
				"Content-Length" : body.length
			},
			"body" : body
		}, function(error, response, body) {
			console.log(response.statusCode);
			if (!error && response.statusCode == 200) {
				console.log(body) // Print the google web page.
			}
		});
	};
	
	eventEmitter.on("DOCUMENT_CREATED", function(event) {
		//Ping list of published documents
		pingHub(h.util.uri.documentsFeed());

		//Get media type and ping specific feed
		pingHub(h.util.uri.mediaFeed(event.event.mediaType));
	});

	eventEmitter.on("ATTACHMENT_CREATED", function(event) {
		//Ping list of attachments
		pingHub(h.util.uri.attachmentsFeed());

		//Ping document details feed
		pingHub(h.util.uri.documentDetailsFeed(event.event.documentId));
	});

	eventEmitter.on("COMMENT_CREATED", function(event) {
		//Ping list of comments
		pingHub(h.util.uri.commentsFeed());

		//Ping document details feed
		pingHub(h.util.uri.documentDetailsFeed(event.event.documentId));
	});

};