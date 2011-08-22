var path = require('path');

var uuid = require('node-uuid');
var restify = require('node-restify');
var log = restify.log;
var cradle = require('cradle');

log.level(restify.LogLevel.Debug);

var Signer = require('signer');
var PluginHandler = require('plugin-handler').PluginHandler;
var registryValidator = require('registry-validator');

module.exports = function(options) {

	options.server = {
		name : "diretto Core API Node",
		version : "0.1.0",
		signature : "diretto Core API Node/0.1.0"
	}

	// TODO fix screwed baseUri options.task.external.uri => foobar/v2 !

//	console.dir(options);
	
	var signer = Signer(options.common.security.salt);

	var plugin = new PluginHandler();
	
	// Load auth plugin
	var auth = null;
	var auths = plugin.preloadAllPluginsSync(path.join(__dirname, '..', '..', 'plugins', 'common', 'auth'), true);
	if (auths[options.core.auth.plugin]) {
		auth = auths[options.core.auth.plugin]();
	}
	if (auth === null) {
		console.error("Could not initialize authentication plugin \"" + options.core.auth.plugin + "\"");
		process.exit(-1);
	}
	
	
	// Preload external content providers
	var externalResProviders =  plugin.preloadAllPluginsSync(path.join(__dirname, '..', '..', 'plugins', 'core-node', 'external-resources'), true);
	var requestedMediatypes = options.mediatypes;
	
	options['mediatypes'] = {
		"stored" : requestedMediatypes.stored,	
		"external" : {}	
	};

	//Check if there are avaiable content provider plugins for the types listed in the config
	requestedMediatypes.external.forEach(function(mime){
		if(externalResProviders[mime]){
			options.mediatypes.external[mime] = externalResProviders[mime]();
		}
	});

	//Load registry
	var registryList = options.registry;
	options.registry = null;
	registryValidator(registryList.services, function(registry) {
		options.registry = registry;
	});

	// Create restify server
	var server = restify.createServer({
		serverName : options.server.signature
	});

	var db = new (cradle.Connection)(options.core.persistence.couchdb.host, options.core.persistence.couchdb.port, {
		cache : false,
		raw : false,
		poolsize : 32
	}).database(options.core.persistence.couchdb.table);

	// API helper objects collects useful stuff and is passed to actual API
	// methods
	var apiHelper = {

		c : require('./util/constants.js'),
 
		options : options,

		util : {
			uri : require('./util/core-uri-builder.js')(options.common.endpoints.core),
			uriParser : require('./util/core-uri-parser.js')(options.common.endpoints.core),
			link : function(href, rel) {
				return {
					href : href || options.common.endpoints.core,
					rel : rel || "self"
				}
			},
			dbPaginator : require('./util/db-paginator.js')(db),
			
		},
		
		signer : signer,

		db : db,

		uuid : uuid,

//		assertion : {
//		//					documentExists : require('./assertions/document-exists.js'),
//		//					taskExists : require('./assertions/task-exists.js'),
//		//					baseTagExists : require('./assertions/basetag-exists.js'),
//		//					submissionExists : require('./assertions/submission-exists.js'),
//		},

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
	apiHelper['util']['dbHelper'] = require('./util/db-helper.js')(apiHelper); 
	apiHelper['util']['dbFetcher'] = require('./util/db-fetcher.js')(apiHelper); 
	apiHelper['util']['commonValidator'] = require('./util/common-validator.js')(apiHelper); 
	

	// Return binding by invoking the actual handlers, passing the helper object
	var api = {

		comment : require('./api/comment.js')(apiHelper),
		attachment : require('./api/attachment.js')(apiHelper),
		collection : require('./api/collection.js')(apiHelper),
		document : require('./api/document.js')(apiHelper),
		index : require('./api/index.js')(apiHelper),
		keyvalues : require('./api/keyvalues.js')(apiHelper),
		link : require('./api/link.js')(apiHelper),
		location : require('./api/location.js')(apiHelper),
		message : require('./api/message.js')(apiHelper),
		query : require('./api/query.js')(apiHelper),
		service : require('./api/service.js')(apiHelper),
		tag : require('./api/tag.js')(apiHelper),
		time : require('./api/time.js')(apiHelper),
		user : require('./api/user.js')(apiHelper),
		vote : require('./api/vote.js')(apiHelper)
	}

	/**
	 * Return a JSON error object
	 */
	var _errorJSON = function(msg) {
		return {
			"error" : {
				"reason" : msg
			}
		};
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

	/**
	 * User authentication If valid, the username will be stored as
	 * 'authenticatedUser' attribute in the request object.
	 */
	var authenticate = function(req, res, next) {
		auth.authenticate(req, function(err, user) {
			if (err) {
				res.send(err.code || 500, _errorJSON("Authentication required"), {
					'WWW-Authenticate' : 'Basic realm=diretto Task API Node Access'
				});
				logging(req, res);
			}
			else {
				req.authenticatedUser = user;
				next();
			}
		});
	};

	/**
	 * User authorization. The authenticatedUser value is checked against a
	 * /:user parameter of the request, if available.
	 */
	var authorize = function(req, res, next) {
		if (!req.authenticatedUser) {
			res.send(err.code || 500, _errorJSON("Authentication required"), {
				'WWW-Authenticate' : 'Basic realm=diretto Task API Node Access'
			});
			logging(req, res);
		}
		else if (!req.uriParams.userId || (req.authenticatedUser !== req.uriParams.userId)) {
			res.send(403, _errorJSON("Missing authorization for request"));
			logging(req, res);
		}
		else {
			next();
		}
	};

	//Forward from root to index
	server.get('/', [], function(req, res, next) {
		res.send(303, null, {
			Location : options.common.endpoints.core
		});
	}, [ logging ]);

	//Attachment
	server.get('/v2/document/:documentId/attachment/:attachmentId', [ authenticate ], api.attachment.get, [ logging ]);
	server.del('/v2/document/:documentId/attachment/:attachmentId/lock', [ authenticate ], api.attachment.unlock, [ logging ]);
	server.post('/v2/document/:documentId/attachments', [ authenticate ], api.attachment.create, [ logging ]);
	server.get('/v2/document/:documentId/attachments', [ authenticate ], api.attachment.forwardAttachments, [ logging ]);
	server.get('/v2/document/:documentId/attachments/cursor/:cursorId', [ authenticate ], api.attachment.listAttachments, [ logging ]);

	// Collection
	server.post('/v2/user/:userId/collection/:collectionId/documents', [ authenticate, authorize ], api.collection.add, [ logging ]);
	server.put('/v2/user/:userId/collection/:collectionId', [ authenticate, authorize ], api.collection.change, [ logging ]);
	server.put('/v2/user/:userId/collections', [ authenticate, authorize ], api.collection.create, [ logging ]);
	server.del('/v2/user/:userId/collection/:collectionId', [ authenticate, authorize ], api.collection.remove, [ logging ]);
	server.get('/v2/user/:userId/collection/:collectionId', [ authenticate ], api.collection.get, [ logging ]);
	server.get('/v2/user/:userId/collection/:collectionId/documents', [ authenticate ], api.collection.forwardCollectionDocs, [ logging ]);
	server.get('/v2/user/:userId/collection/:collectionId/documents/cursor/:cursorId', [ authenticate ], api.collection.listCollectionDocs, [ logging ]);
	server.get('/v2/user/:userId/collections', [ authenticate ], api.collection.getUserCollections, [ logging ]);

	// Comment
	server.get('/v2/document/:documentId/comment/:commentId', [ authenticate ], api.comment.get, [ logging ]);
	server.post('/v2/document/:documentId/comments', [ authenticate ], api.comment.create, [ logging ]);
	server.get('/v2/document/:documentId/comments', [ authenticate ], api.comment.forwardDocumentComments, [ logging ]);
	server.get('/v2/document/:documentId/comments/cursor/:cursorId', [ authenticate ], api.comment.listDocumentComments, [ logging ]);
	server.get('/v2/user/:userId/comments', [ authenticate ], api.comment.forwardUserComments, [ logging ]);
	server.get('/v2/user/:userId/comments/cursor/:cursorId', [ authenticate ], api.comment.listUserComments, [ logging ]);

	//Document
	server.put('/v2/document/:documentId', [ authenticate ], api.document.create, [ logging ]);
	server.get('/v2/document/:documentId', [ authenticate ], api.document.getMetdata, [ logging ]);
	server.get('/v2/document/:documentId/snapshot', [ authenticate ], api.document.getSnapshot, [ logging ]);
	server.get('/v2/document/:documentId/full', [ authenticate ], api.document.getFull, [ logging ]);
	server.get('/v2/documents/full', [ authenticate ], api.document.batchFull, [ logging ]);
	server.get('/v2/documents/snapshot', [ authenticate ], api.document.batchSnapshot, [ logging ]);
	server.get('/v2/documents/multiple', [ authenticate ], api.document.batchMetadata, [ logging ]);
	server.get('/v2/documents', [ authenticate ], api.document.forwardDocuments, [ logging ]);
	server.get('/v2/documents/since/:since', [ authenticate ], api.document.forwardSince, [ logging ]);
	server.get('/v2/documents/cursor/:cursorId', [ authenticate ], api.document.listDocuments, [ logging ]);
	server.get('/v2/user/:userId/documents', [ authenticate ], api.document.forwardUserDocuments, [ logging ]);
	server.get('/v2/user/:userId/documents/cursor/:cursorId', [ authenticate ], api.document.listUserDocuments, [ logging ]);

	// Index
	server.get('/v2', [], api.index.get, [ logging ]);

	//Key-Values
	server.get('/v2/document/:documentId/value/:userId/:key', [ authenticate ], api.keyvalues.get, [ logging ]);
	server.del('/v2/document/:documentId/value/:userId/:key', [ authenticate, authorize ], api.keyvalues.remove, [ logging ]);
	server.put('/v2/document/:documentId/value/:userId/:key', [ authenticate, authorize ], api.keyvalues.put, [ logging ]);
	server.get('/v2/document/:documentId/values', [ authenticate ], api.keyvalues.getAll, [ logging ]);

	//Link
	server.post('/v2/links', [ authenticate ], api.link.create, [ logging ]);
	server.get('/v2/links', [ authenticate ], api.link.forwardLinks, [ logging ]);
	server.get('/v2/links/since/:since', [ authenticate ], api.link.forwardSince, [ logging ]);
	server.get('/v2/links/cursor/:cursorId', [ authenticate ], api.link.listLinks, [ logging ]);
	server.get('/v2/link/:linkId', [ authenticate ], api.link.get, [ logging ]);
	server.get('/v2/document/:documentId/links', [ authenticate ], api.link.getDocumentLinks, [ logging ]);

	//Location
	server.get('/v2/document/:documentId/location/:location', [ authenticate ], api.location.get, [ logging ]);
	server.put('/v2/document/:documentId/location/:location', [ authenticate ], api.location.create, [ logging ]);
	server.get('/v2/document/:documentId/locations', [ authenticate ], api.location.getAll, [ logging ]);

	//Message	
	server.get('/v2/user/:userId/:box/messages/since/:since', [ authenticate, authorize ], api.message.forwardSince, [ logging ]);
	server.get('/v2/user/:userId/:box', [ authenticate, authorize ], api.message.forwardBox, [ logging ]);
	server.get('/v2/user/:userId/:box/messages/cursor/:cursorId', [ authenticate, authorize ], api.message.listBox, [ logging ]);
	server.post('/v2/user/:userId/inbox/messages', [ authenticate ], api.message.send, [ logging ]); //userId => target ==> no authorize here
	server.get('/v2/user/:userId/:box/message/:messageId', [ authenticate, authorize ], api.message.get, [ logging ]);
	server.del('/v2/user/:userId/:box/message/:messageId', [ authenticate, authorize ], api.message.remove, [ logging ]);

	// Query
	server.post('/v2/query', [ authenticate ], api.query.create, [ logging ]);
	server.get('/v2/query/stored/:queryId', [ authenticate ], api.query.forward, [ logging ]);
	server.get('/v2/query/stored/:queryId/cursor/:cursorId', [ authenticate ], api.query.resultPage, [ logging ]);

	//Service
	server.get('/v2/service/mediatypes', [], api.service.mediatypes, [ logging ]);
	server.get('/v2/service/uuid', [], api.service.uuid, [ logging ]);
	server.get('/v2/service/registry', [], api.service.registry, [ logging ]);

	//Tag
	server.post('/v2/tags', [ authenticate ], api.tag.createBasetag, [ logging ]);
	server.get('/v2/tag/:tagId', [ authenticate ], api.tag.getBasetag, [ logging ]);
	server.post('/v2/tags/multiple', [ authenticate ], api.tag.fetchBasetags, [ logging ]);
	server.get('/v2/tags', [ authenticate ], api.tag.forwardBasetag, [ logging ]);
	server.get('/v2/tags/cursor/:cursorId', [ authenticate ], api.tag.listBasetag, [ logging ]);

	server.post('/v2/document/:documentId/tags', [ authenticate ], api.tag.appendToDocument, [ logging ]);
	server.get('/v2/document/:documentId/tags', [ authenticate ], api.tag.getAllByDocument, [ logging ]);
	server.get('/v2/document/:documentId/tag/:tagId', [ authenticate ], api.tag.getByDocument, [ logging ]);

	server.get('/v2/tag/:tagId/documents', [ authenticate ], api.tag.forwardDocumentsByTag, [ logging ]);
	server.get('/v2/tag/:tagId/documents/cursor/:cursorId', [ authenticate ], api.tag.listDocumentsByTag, [ logging ]);

	server.get('/v2/tag/:tagId/links', [ authenticate ], api.tag.forwardLinksByTag, [ logging ]);
	server.get('/v2/tag/:tagId/links/cursor/:cursorId', [ authenticate ], api.tag.listLinksByTag, [ logging ]);

	server.post('/v2/link/:linkId/tags', [ authenticate ], api.tag.appendToLink, [ logging ]);
	server.get('/v2/link/:linkId/tags', [ authenticate ], api.tag.getAllByLink, [ logging ]);
	server.get('/v2/link/:linkId/tag/:tagId', [ authenticate ], api.tag.getByLink, [ logging ]);

	//Time
	server.get('/v2/document/:documentId/time/:time', [ authenticate ], api.time.get, [ logging ]);
	server.put('/v2/document/:documentId/time/:time', [ authenticate ], api.time.create, [ logging ]);
	server.get('/v2/document/:documentId/times', [ authenticate ], api.time.getAll, [ logging ]);

	//User
	server.get('/v2/user/:userId', [ authenticate ], api.user.get, [ logging ]);
	server.put('/v2/user/:userId', [ authenticate, authorize ], api.user.change, [ logging ]);
	server.post('/v2/users', [], api.user.create, [ logging ]);
	server.get('/v2/users', [authenticate], api.user.forwardUsers, [ logging ]);
	server.get('/v2/users/cursor/:cursorId', [authenticate], api.user.listUsers, [ logging ]);
	server.post('/v2/users/multiple', [authenticate], api.user.fetchMultiple, [ logging ]);

	var votableUris = [ {
		uri : "/v2/document/:documentId/attachment/:attachmentId"
	}, {
		uri : "/v2/document/:documentId/tag/:tagId"
	}, {
		uri : "/v2/document/:documentId/comment/:commentId"
	}, {
		uri : "/v2/link/:linkId/tag/:tagId"
	}, {
		uri : "/v2/link/:linkId"
	}, {
		uri : "/v2/document/:documentId/time/:time"
	}, {
		uri : "/v2/document/:documentId/location/:location"
	}, ];

	votableUris.forEach(function(i) {
		server.get(i.uri + '/votes', [ authenticate ], api.vote.getAll, [ logging ]);
		server.get(i.uri + '/vote/user/:userId', [ authenticate, authorize ], api.vote.get, [ logging ]);
		server.del(i.uri + '/vote/user/:userId', [ authenticate, authorize ], api.vote.undo, [ logging ]);
		server.put(i.uri + '/vote/user/:userId/:vote', [ authenticate, authorize ], api.vote.cast, [ logging ]);

	});

	return {

		bind : function() {
			server.listen(options.core.bind.port || 8001, options.core.bind.ip || "127.0.0.1");
		}

	};

};
