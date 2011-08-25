var barrierpoints = require('barrierpoints');

module.exports = function(h) {

	/*
	 * ------------------------------ Validation Functions
	 * --------------------------------
	 */
	var LINK_TITLE_MIN_LENGTH = 3;
	var LINK_TITLE_MAX_LENGTH = 128;

	var LINK_DESC_MAX_LENGTH = 1024;

	/**
	 * Validates submitted link
	 */
	var validateLinkData = function(data, response, next, callback) {
		var fail = function(msg) {
			h.responses.error(400, "Invalid link values. " + (msg || "Please check your entity structure."), response, next);
		};

		if (!data || !data.title || !data.description || !data.source || !data.destination) {
			fail("Attributes are missing.");
			return;
		}

		if ((typeof data.title !== "string") || (data.title.length < LINK_TITLE_MIN_LENGTH) || (data.title.length > LINK_TITLE_MAX_LENGTH)) {
			fail("Invalid title");
			return;
		}
		if ((typeof data.description !== "string") || (data.description.length > LINK_DESC_MAX_LENGTH)) {
			fail("Invalid description");
			return;
		}

		if (!data.source.document || !data.source.document.link || !data.source.document.link.href || !(typeof data.source.document.link.href === "string")) {
			fail("Invalid source link");
			return;
		}

		if (!data.destination.document || !data.destination.document.link || !data.destination.document.link.href || !(typeof data.destination.document.link.href === "string")) {
			fail("Invalid source link");
			return;
		}

		callback({
			title : data.title,
			description : data.description,
			source : {
				document : {
					link : {
						rel : "self",
						href : data.source.document.link.href
					}
				}
			},
			destination : {
				document : {
					link : {
						rel : "self",
						href : data.destination.document.link.href
					}
				}
			}
		});
	};

	return {

		create : function(req, res, next) {
			validateLinkData(req.params, res, next, function(data) {

				var linkId = h.uuid();

				var sourceId = h.util.uriParser.extractDocumentId(data.source.document.link.href);
				var destId = h.util.uriParser.extractDocumentId(data.destination.document.link.href);

				if (sourceId === null || destId === null) {
					h.responses.error(400, "Invalid document URIs.", res, next);
					return;
				}

				var linkDoc = {
					_id : h.c.LINK.wrap(linkId),
					type : h.c.LINK.TYPE,
					linkId : linkId,
					creator : req.authenticatedUser,
					creationTime : new Date().toRFC3339UTCString(),
					title : data.title,
					description : data.description,
					source : sourceId,
					destination : destId
				};

				var saveLink = function() {
					h.db.save(linkDoc._id, linkDoc, function(err) {
						if (err) {
							h.responses.error(500, "Internal server error.", res, next);
							return;
						}
						else {
							res.send(201, {
								"link" : h.util.link(h.util.uri.link(linkId))
							}, {
								'Location' : h.util.uri.link(linkId)
							});
							return next();
						}
					});
				};

				var b = barrierpoints(2, saveLink);

				[ sourceId, destId ].forEach(function(doc) {
					h.util.dbFetcher.viewKeyExists('docs/published_docs', doc.documentId, function(err, published){
						if(err){
							b.abort(function(){
								h.responses.error(500, "Internal server error.", res, next);
								return;
							});
						}
						else if(!published){
							b.abort(function(){
								h.responses.error(404, "Linked document ("+h.util.uri.document(doc.documentId)+") not found.", res, next);
								return;
							});
						}
						else{
							b.submit();
						}
					});
					
				});

			});
		},

		forwardLinks : function(req, res, next) {
			h.util.dbPaginator.forward("docs/links_by_date", [], function(row){
				return row.key[1];
			},function(err,cursor){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if ( cursor === null){
					res.send(204);
					return next();
				}
				else{
					var uri = h.util.uri.linkListPage(cursor);
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});
		},
		
		forwardSince : function(req, res, next) {
			h.util.dbPaginator.forwardSince("docs/links_by_date",req.uriParams.since,[],function(row){
				return row.key[1];
			},function(err,cursor){
				if(err){
					
					h.responses.error(500,((err.error && err.error.reason) ? err.error.reason : "Internal server error."),res,next);
				}
				else if ( cursor === null){
					res.send(204);
					return next();
				}
				else{
					console.dir(cursor);
					
					var uri = h.util.uri.linkListPage(cursor); 
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});
		},
		
		listLinks : function(req, res, next) {
			res.send(501);
			return next();
		},
		get : function(req, res, next) {
			res.send(501);
			return next();
		},
		getDocumentLinks : function(req, res, next) {
			res.send(501);
			return next();
		}

	};
};