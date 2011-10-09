var path = require('path');

var uuid = require('node-uuid');
var restify = require('node-restify');
var log = restify.log;
var cradle = require('cradle');

var mustache = require('mustache');

log.level(restify.LogLevel.Debug);

var Signer = require('signer');
var PluginHandler = require('plugin-handler').PluginHandler;
var registryValidator = require('registry-validator');
var direttoUtil = require('diretto-util');

module.exports = function(options) {
	
	options.server = {
		name : "diretto Feed API Node",
		version : "0.1.0",
		signature : "diretto Feed API Node/0.1.0"
	}
	
	// Create restify server
	var server = restify.createServer({
		serverName : options.server.signature,
		accept : ["application/json","application/xml","application/atom+xml"]
	});
	
	var db = new (cradle.Connection)(options.feed.persistence.couchdb.host, options.feed.persistence.couchdb.port, {
		cache : false,
		raw : false,
		poolsize : 32
	}).database(options.feed.persistence.couchdb.table);

	// API helper objects collects useful stuff and is passed to actual API
	// methods
	var apiHelper = {

		c : require('../core-node/util/constants.js'),
 
		options : options,
		
		mustache : mustache,

		util : {
			uri : require('./util/feed-uri-builder.js')(options.common.endpoints.feed),
			coreUri : require('../core-node/util/core-uri-builder.js')(options.common.endpoints.core),
			uriParser : require('../core-node/util/core-uri-parser.js')(options.common.endpoints.core),
			link : function(href, rel) {
				return {
					href : href || options.common.endpoints.core,
					rel : rel || "self"
				}
			},
			feedPaginator : require('./util/feed-paginator.js')(db),
			
			empty : direttoUtil.empty,
			
		},
		
		db : db,

		uuid : uuid,

		responses : {

			notImplemented : function(req, res, next) {
				res.send(501, {
					error : {
						reason : "Not yet implemented"
					}
				});
				next();
			},

			notFound : function(req, res, next) {
				res.send(404, {
					error : {
						reason : "Not found"
					}
				});
				next();
			},

			error : function(code, message, res, next) {

				console.log(message);
				res.send(code || 500, {
					"error" : {
						"reason" : message || "Internal server error"
					}
				});
				next();
			}
		}
	};
	apiHelper['util']['dbHelper'] = require('../core-node/util/db-helper.js')(apiHelper); 
	apiHelper['util']['dbFetcher'] = require('../core-node/util/db-fetcher.js')(apiHelper); 
	apiHelper['util']['commonValidator'] = require('../core-node/util/common-validator.js')(apiHelper); 
	apiHelper['util']['renderer'] = require('./util/feed-renderer.js')(apiHelper); 
	
	var dbUri = "http://"+(options.feed.persistence.couchdb.host  || "localhost")+":"+(options.feed.persistence.couchdb.port  || "5984")+"/"+(options.feed.persistence.couchdb.table || "diretto_main");
	var eventListener = require('../event-listener')(dbUri);
	
	var pushPing = require("./util/push-ping.js")(apiHelper, eventListener.get()); 
	
	var api = {

			index : require('./api/index.js')(apiHelper),
			atomfeed : require('./api/atomfeed.js')(apiHelper),
			geofeed : require('./api/geofeed.js')(apiHelper)
		};
	
	

	/**
	 * Ugly logging so far
	 */
	var logging = function(req, res, next) {
		var logEntry = new Date().toUTCString() + " " + req.connection.remoteAddress + ": " + req.method + " " + req.url;
		console.log(logEntry);

		if (next) {
			next();
		}
	};
	
	//Forward from root to index
	server.get('/', [], function(req, res, next) {
		res.send(303, null, {
			Location : options.common.endpoints.feed
		});
	}, [ logging ]);

	//Atom Feeds
	server.get('/v2/feed/documents', [  ], api.atomfeed.getDocumentsFeed, [ logging ]);
	server.get('/v2/feed/documents/cursor/:cursorId', [  ], api.atomfeed.getDocumentsFeed, [ logging ]);
	server.get('/v2/feed/attachments', [  ], api.atomfeed.getAttachmentsFeed, [ logging ]);
	server.get('/v2/feed/attachments/cursor/:cursorId', [  ], api.atomfeed.getAttachmentsFeed, [ logging ]);
	server.get('/v2/feed/comments', [  ], api.atomfeed.getCommentsFeed, [ logging ]);
	server.get('/v2/feed/comments/cursor/:cursorId', [  ], api.atomfeed.getCommentsFeed, [ logging ]);
	server.get('/v2/feed/media/:mediaType', [  ], api.atomfeed.getMediaFeed, [ logging ]);
	server.get('/v2/feed/media/:mediaType/cursor/:cursorId', [  ], api.atomfeed.getMediaFeed, [ logging ]);
	server.get('/v2/feed/document/:documentId', [  ], api.atomfeed.getDocumentDetailsFeed, [ logging ]);

	//Geo Feeds
	server.get('/v2/feed/geo/area', [  ], api.geofeed.getByBbox, [ logging ]);
	server.get('/v2/feed/geo/documents', [  ], api.geofeed.getDocuments, [ logging ]);
	server.get('/v2/feed/geo/document/:documentId/positions', [  ], api.geofeed.getDocumentPositions, [ logging ]);
	
	// Index
	server.get('/v2', [], api.index.get, [ logging ]);
	
	
	return {

		bind : function() {
			server.listen(options.feed.bind.port || 8001, options.feed.bind.ip || "127.0.0.1");
		}

	};
};