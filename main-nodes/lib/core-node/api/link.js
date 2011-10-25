/**
 * Link Handler
 * 
 * @author Benjamin Erb
 */

var barrierpoints = require('barrierpoints');

module.exports = function(h) {

	var BATCH_LIMIT = h.options.core.parameters.batchLimit || 50;
	var PAGINATION_SIZE = 2;// h.options.core.parameters.paginationSize || 20;

	/*
	 * 
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

		if (data  === undefined || data.title  === undefined || data.description  === undefined || data.source  === undefined || data.destination === undefined ) {
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
							
							h.util.events.linkCreated({
								linkId : linkId,
								sourceDocumentId : sourceId,
								destinationDocumentId : destId
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
					var uri = h.util.uri.linkListPage(cursor); 
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});
		},
		
		get : function(req, res, next) {
			h.util.dbFetcher.fetchLinkResources(["link",req.uriParams.linkId],function(err, result){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(h.util.empty(result)){
					h.responses.error(404,"Link not found.",res,next);
				}
				else{
					res.send(200, h.util.renderer.link(result[req.uriParams.linkId]));
					return next();
				}
			});
		},
		
		listLinks : function(req, res, next) {
			h.util.dbFetcher.fetch(req.uriParams.cursorId, h.c.LINK, function(err,doc){
				if(err && err === 404){
					h.responses.error(404,"Cursor not found.",res,next);
					return;
				}
				else if(err){
					h.responses.error(500,"Internal server error.",res,next);
					return;
				}
				else{
					
					var key = [doc.creationTime, req.uriParams.cursorId];
					
					var pageLink = h.util.uri.linkListPage;
					
					h.util.dbPaginator.getPage('docs/links_by_date', key, [], PAGINATION_SIZE, false, false, function(row){
						return {
							key : row.key[1]
						};
					}, function(err, result){
						if(err){
							res.send(500);
						}
						else{
							
							var linkList = result.list.map(function(row){
								return row.key
							});
							
							var related = [];
							["next", "previous"].forEach(function(e){
								if(result[e]){
									related.push({
										"link" : h.util.link(pageLink(result[e].key), e)
									});
								}
							});
							
							var headers = {};
							if(result.etag){
								headers["Etag"] = '"'+result.etag+'"';
							}
							
							h.util.dbFetcher.fetchMultipleLinksById(linkList,function(err, fetchResult){
								if(err){
									h.responses.error(500,"Internal server error.",res,next);
								}
								else if(h.util.empty(fetchResult)){
									h.responses.error(404,"Link not found.",res,next);
								}
								else{
									var resultlist = result.list.map(function(row){
										return h.util.renderer.link(fetchResult[row.key]);
									});
									
									res.send(200, {
										"page" : {
											"link" : h.util.link(pageLink(req.uriParams.cursorId))
										},
										"list" :  resultlist,
										"related" : related
									},headers);
									return next();
								}
							});
								
							
							
						}
					});
					
				}
			});
		},
		
		getDocumentLinks : function(req, res, next) {
			
			var responseData = {
				documentLinks : {
					link : h.util.link(h.util.uri.document(req.uriParams.documentId)+"/links"),
					"in" : [],
					"out" : []			
				}
			}
			
			h.db.view('docs/links_by_doc', {
				startkey : [req.uriParams.documentId],
				endkey : [req.uriParams.documentId,{}]
			}, function(err, dbRes) {
				if (dbRes && dbRes.length > 0) {
					
					var inLinks = [];
					var outLinks = [];
					var linkList = [];
					
					for(var i = 0;i<dbRes.length ;i++){
						if(dbRes[i].key[1] === "in"){
							inLinks.push(dbRes[i].key[2]);	
						}
						else if(dbRes[i].key[1] === "out"){
							outLinks.push(dbRes[i].key[2]);
						}
						linkList.push(dbRes[i].key[2]);
					}
					
					h.util.dbFetcher.fetchMultipleLinksById(linkList,function(err, fetchResult){
						if(err){
							h.responses.error(500,"Internal server error.",res,next);
						}
						else if(h.util.empty(fetchResult)){
							h.responses.error(404,"Link not found.",res,next);
						}
						else{
							
							inLinks.forEach(function(id){
								responseData.documentLinks["in"].push(h.util.renderer.link(fetchResult[id]));
							});
							outLinks.forEach(function(id){
								responseData.documentLinks["out"].push(h.util.renderer.link(fetchResult[id]));
							});
							res.send(200, responseData);
							return next();
						}
					});
					
					
					
				}
				else if (dbRes) {
					res.send(200, responseData);
					return next();
				}
				else {
					h.responses.error(500,"Internal server error.",res,next);
					return;
				}
			});
		}
		

	};
};