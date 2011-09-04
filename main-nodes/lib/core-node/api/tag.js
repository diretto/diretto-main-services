var crypto = require('crypto');

var barrierpoints = require('barrierpoints');

module.exports = function(h) {

	var BATCH_LIMIT = h.options.core.parameters.batchLimit || 50;
	var PAGINATION_SIZE = h.options.core.parameters.paginationSize || 20;

	var TAG_MIN_LENGTH = 2;
	var TAG_MAX_LENGTH = 64;
	
	/*
	 * ------------------------------ Validation Functions --------------------------------
	 */
	

	// returns null if ok, otherwise error
	var validateBaseTagGeneric = function(tag) {

		if (!tag || !(typeof (tag) == 'string' && tag.length >= TAG_MIN_LENGTH && tag.length <= TAG_MAX_LENGTH)) {
			return {
				error : {
					reason : "Invalid tag entity. Please check your entity structure."
				}
			};
		}
		else {
			return null;
		}
	};

	var validateBaseTag = function(data, response, next, callback) {
		var fail = function(msg) {
			h.responses.error(400, "Invalid message. " + (msg || "Please check your entity structure."), response, next);
		};

		// Check main attributes
		if (!data || !data.value) {
			fail("Attributes are missing.");
			console.log(data);
			return;
		}

		// Check tag
		if (validateBaseTagGeneric(data.value) !== null) {
			fail("Invalid tag.");
			return;
		}

		callback({
			"value" : data.value
		});
	};
	
	var validateAppendTag = function(data, response, next, callback) {
		var fail = function(msg) {
			h.responses.error(400, "Invalid tag. " + (msg || "Please check your entity structure."), response, next);
		};

		// Check main attributes
		if (!data || !data.baseTag) {
			fail("Attributes are missing.");
			return;
		}
		
		if(!data.baseTag.link || !data.baseTag.link.href || (typeof data.baseTag.link.href !== "string")){
			fail("Invalid URI.");
			return;
		}
		
		callback({
			 "baseTag":{
			      "link":{
			         "rel":"self",
			         "href": data.baseTag.link.href
			      }
			   }
		});
	};
	
	/*
	 * ------------------------------- -----------------------------------------------------
	 */


	var createBaseTag = function(_tag, creator, callback) {
		var md5calc = crypto.createHash('md5');
		md5calc.update(_tag);
		var tagId = md5calc.digest('hex');

		var successResponse = {
			"baseTag" : {
				"link" : h.util.link(h.util.uri.baseTag(tagId))
			}
		};

		h.util.dbFetcher.exist(tagId, h.c.BASETAG, function(code) {
			if (code === 200) {
				callback(null, successResponse, true);
			}
			else if (code === 404) {
				var tagDoc = {
					_id : h.c.BASETAG.wrap(tagId),
					baseTagId : tagId,
					type : h.c.BASETAG.TYPE,
					creationTime : new Date().toRFC3339UTCString(),
					creator : creator,
					value : _tag
				};

				h.db.save(tagDoc._id, tagDoc, function(err, dbRes) {

					if (err) {
						if (err.error && err.error === 'conflict') {
							callback(null, successResponse);
						}
						else {
							callback("oops");
						}
					}
					else {
						callback(null, successResponse);
					}
				});
			}
			else {
				callback("oops");
			}
		});
	};

	var handleMultipleBaseTags = function(data, req, res, next) {

		var results = {};

		if (data && data.values && typeof (data.values) == 'object' && typeof (data.values.length) === 'number') {

			if (data.values.length > 0) {

				var successCallback = function() {
					res.send(200, {
						results : results
					});
					next();
					return;
				};

				var b = barrierpoints(data.values.length, successCallback);

				data.values.forEach(function(value) {
					var err = validateBaseTagGeneric(value);
					if (err !== null) {
						results[value] = err;
						b.submit();
					}
					else {
						createBaseTag(value, req.authenticatedUser, function(error, basetag) {
							if (error) {
								results[value] = {
									error : {
										"reason" : "internal error"
									}
								}
							}
							else {
								results[value] = basetag;
							}
							b.submit();
						});
					}
				});
			}
			else {
				h.responses.error(400, "List is empty", res, next);
			}
		}
		else {
			h.responses.error(400, "Invalid tag request entity.", res, next);
		}
	};

	return {

		createBasetag : function(req, res, next) {
			validateBaseTag(req.params, res, next, function(data) {
				createBaseTag(data.value, req.authenticatedUser, function(err, successResponse, alreadyExists) {
					if (err) {
						h.responses.error(500, "Internal server error.", response, next);
					}
					else {
						res.send((!!alreadyExists ? 202 : 201), successResponse, {
							Location : successResponse.baseTag.link.href
						});
						return next();
					}
				});
			});
		},

		fetchBasetags : function(req, res, next) {
			handleMultipleBaseTags(req.params, req, res, next);
		},

		getBasetag : function(req, res, next) {
			h.util.dbFetcher.fetch(req.uriParams.tagId, h.c.BASETAG, function(err,doc){
				if(err && err === 404){
					h.responses.error(404,"Tag not found.",res,next);
					return;
				}
				else if(err){
					h.responses.error(500,"Internal server error. Please try again later.",res,next);
					return;
				}				
				else{
					res.send(200, h.util.renderer.baseTag(doc));
					next();
				}
			});
		},
		
		forwardBasetag : function(req, res, next) {
			h.util.dbPaginator.forward("docs/tags_by_hash", [], function(row){
				return row.key[0];
			},function(err,cursor){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if ( cursor === null){
					res.send(204);
					return next();
				}
				else{
					var uri = h.util.uri.baseTagListPage(cursor);
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});
		},
		
		listBasetag : function(req, res, next) {
			var key = [req.uriParams.cursorId];
			var pageLink = h.util.uri.baseTagListPage;
			h.util.dbPaginator.getPage("docs/tags_by_hash", key, [], PAGINATION_SIZE, false, true, function(row){
				return {
					key : row.key[0],
					doc : row.doc
				};
			}, function(err, result){
				if(err){
					res.send(500);
					next();
				}
				else{
					
					var list = result.list.map(function(row){
						return h.util.renderer.baseTag(row.doc);
					});
					
					var related = [];
					["next", "previous"].forEach(function(e){
						if(result[e]){
							console.dir( result[e]);
							related.push({
								"link" : h.util.link(pageLink(result[e].key), e)
							});
						}
					});
					
					var headers = {};
					if(result.etag){
						headers["Etag"] = '"'+result.etag+'"';
					}
					
					res.send(200, {
						"page" : {
							"link" : h.util.link(pageLink(req.uriParams.cursorId))
						},
						"list" :  list,
						"related" : related
					},headers);
					return next();
				}
			});
		},
		
		appendToDocument : function(req, res, next) {
			validateAppendTag(req.params, res, next, function(data) {
				var baseTagId = h.util.uriParser.extractBaseTagId(data.baseTag.link.href).baseTagId;
				
				var successUri = h.util.uri.documentTag(req.uriParams.documentId, baseTagId);
				var successResponse = {
						link : h.util.link(successUri)
				}
				
				var tagId = h.util.dbHelper.concat(req.uriParams.documentId,baseTagId);
				h.util.dbFetcher.exist(tagId, h.c.TAG, function(code){
					if(code === 200){
						res.send(202, successResponse, {
							'Location' : successUri
						});
						return next();
					}
					else if(code === 404){
						//tag not exists => doc existing?
						h.util.dbFetcher.exist(req.uriParams.documentId, h.c.DOCUMENT, function(code){
							if(code === 200){
								//doc exists => basetag existing?
								h.util.dbFetcher.fetch(baseTagId, h.c.BASETAG, function(err, baseTagDoc){
									
									if (err && err === 404) {
										h.responses.error(404, "Tag not found.", res, next);
										return;
									}
									else if (err) {
										h.responses.error(500,"Internal server error.",res,next);
									}
									else{
										var tagDoc = {
												_id : h.c.TAG.wrap(tagId),
												type : h.c.TAG.TYPE,
												tagType : 'document',
												documentId : req.uriParams.documentId,
												baseTagId : baseTagId,
												creator : req.authenticatedUser,
												creationTime :  new Date().toRFC3339UTCString(),
												value : baseTagDoc.value
											};
											
											h.db.save(tagDoc._id, tagDoc, function(err, dbRes) {

												if (err) {
													if (err.error && err.error === 'conflict') {
														res.send(202, successResponse, {
															'Location' : successUri
														});
														return next();
													}
													else {
														h.responses.error(500,"Internal server error.",res,next);
													}
												}
												else {
													res.send(201, successResponse, {
														'Location' : successUri
													});
													return next();
												}
											});		
									}
								});
							}
							else if(code === 404){
								h.responses.error(404,"Document not found.",res,next);
							}
							else{
								h.responses.error(500,"Internal server error.",res,next);
							}					
						});
					}
					else{
						h.responses.error(500,"Internal server error.",res,next);
					}					
				});
			});		
		},		
		
		appendToLink : function(req, res, next) {
			validateAppendTag(req.params, res, next, function(data) {
				var baseTagId = h.util.uriParser.extractBaseTagId(data.baseTag.link.href).baseTagId;
				
				var successUri = h.util.uri.linkTag(req.uriParams.linkId, baseTagId);
				var successResponse = {
						link : h.util.link(successUri)
				}
				
				var tagId = h.util.dbHelper.concat(req.uriParams.linkId,baseTagId);
				h.util.dbFetcher.exist(tagId, h.c.TAG, function(code){
					if(code === 200){
						res.send(202, successResponse, {
							'Location' : successUri
						});
						return next();
					}
					else if(code === 404){
						//tag not exists => link existing?
						h.util.dbFetcher.exist(req.uriParams.linkId, h.c.LINK, function(code){
							if(code === 200){
								//link exists => basetag existing?
								h.util.dbFetcher.fetch(baseTagId, h.c.BASETAG, function(err, baseTagDoc){
									
									if (err && err === 404) {
										h.responses.error(404, "Tag not found.", res, next);
										return;
									}
									else if (err) {
										h.responses.error(500,"Internal server error.",res,next);
									}
									else{
										var tagDoc = {
												_id : h.c.TAG.wrap(tagId),
												type : h.c.TAG.TYPE,
												tagType : 'link',
												linkId : req.uriParams.linkId,
												baseTagId : baseTagId,
												creator : req.authenticatedUser,
												creationTime :  new Date().toRFC3339UTCString(),
												value : baseTagDoc.value
											};
											
										console.log(tagDoc);
										
											h.db.save(tagDoc._id, tagDoc, function(err, dbRes) {

												if (err) {
													if (err.error && err.error === 'conflict') {
														res.send(202, successResponse, {
															'Location' : successUri
														});
														return next();
													}
													else {
														h.responses.error(500,"Internal server error.",res,next);
													}
												}
												else {
													res.send(201, successResponse, {
														'Location' : successUri
													});
													return next();
												}
											});		
									}
								});
							}
							else if(code === 404){
								h.responses.error(404,"Link not found.",res,next);
							}
							else{
								h.responses.error(500,"Internal server error.",res,next);
							}					
						});
					}
					else{
						h.responses.error(500,"Internal server error.",res,next);
					}					
				});
			});
		},
		
		
		forwardDocumentsByTag : function(req, res, next) {
			h.util.dbPaginator.forward("docs/docs_by_tag", [req.uriParams.tagId], function(row){
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
					var uri = h.util.uri.docsByTagPage(req.uriParams.tagId, cursor);
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});
		},
		
		listDocumentsByTag : function(req, res, next) {
			var key = [req.uriParams.tagId, req.uriParams.cursorId];
			var pageLink = h.util.uri.docsByTagPage;
			h.util.dbPaginator.getPage("docs/docs_by_tag", key, [req.uriParams.tagId], PAGINATION_SIZE, false, false, function(row){
				return {
					key : row.key[1],
				};
			}, function(err, result){
				if(err){
					res.send(500);
					next();
				}
				else{
					
					var list = result.list.map(function(row){
						return {
							document : {
								link : h.util.link(h.util.uri.document(row.key))
							}
						};
					});
					
					var related = [];
					["next", "previous"].forEach(function(e){
						if(result[e]){
							console.dir( result[e]);
							related.push({
								"link" : h.util.link(pageLink(result[e].key), e)
							});
						}
					});
					
					var headers = {};
					if(result.etag){
						headers["Etag"] = '"'+result.etag+'"';
					}
					
					res.send(200, {
						"page" : {
							"link" : h.util.link(pageLink(req.uriParams.tagId, req.uriParams.cursorId))
						},
						"list" :  list,
						"related" : related
					},headers);
					return next();
				}
			});
		},
		
		forwardLinksByTag : function(req, res, next) {
			h.util.dbPaginator.forward("docs/links_by_tag", [req.uriParams.tagId], function(row){
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
					var uri = h.util.uri.linksByTagPage(req.uriParams.tagId, cursor);
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});
		},
		
		listLinksByTag : function(req, res, next) {
			var key = [req.uriParams.tagId, req.uriParams.cursorId];
			var pageLink = h.util.uri.linksByTagPage;
			h.util.dbPaginator.getPage("docs/links_by_tag", key, [req.uriParams.tagId], PAGINATION_SIZE, false, false, function(row){
				return {
					key : row.key[1],
				};
			}, function(err, result){
				if(err){
					res.send(500);
					next();
				}
				else{
					
					var list = result.list.map(function(row){
						return {
							document : {
								link : h.util.link(h.util.uri.link(row.key))
							}
						};
					});
					
					var related = [];
					["next", "previous"].forEach(function(e){
						if(result[e]){
							console.dir( result[e]);
							related.push({
								"link" : h.util.link(pageLink(result[e].key), e)
							});
						}
					});
					
					var headers = {};
					if(result.etag){
						headers["Etag"] = '"'+result.etag+'"';
					}
					
					res.send(200, {
						"page" : {
							"link" : h.util.link(pageLink(req.uriParams.tagId, req.uriParams.cursorId))
						},
						"list" :  list,
						"related" : related
					},headers);
					return next();
				}
			});
		},
		
		
		
		getAllByDocument : function(req, res, next) {
			h.util.dbFetcher.fetchDocumentResources(["document",req.uriParams.documentId, "tag"],function(err, result){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(h.util.empty(result)){
					//empty result, so check if document exists at all
					h.util.dbFetcher.exist(req.uriParams.documentId, h.c.DOCUMENT, function(code){
						if(code === 200){
							res.send(200, h.util.renderer.documentTagList(req.uriParams.documentId,{}));
							return next();
						}
						else if(code === 404){
							h.responses.error(404,"Document not found.",res,next);
						}
						else{
							h.responses.error(500,"Internal server error.",res,next);
						}
					});
				}
				else{
					res.send(200, h.util.renderer.documentTagList(req.uriParams.documentId,result[req.uriParams.documentId]["tag"]));
					return next();
				}
			});
		},
		
		getByDocument : function(req, res, next) {
			h.util.dbFetcher.fetchDocumentResources(["document",req.uriParams.documentId, "tag", req.uriParams.tagId],function(err, result){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(h.util.empty(result)){
					h.responses.error(404,"Tag not found.",res,next);
				}
				else{
					res.send(200, h.util.renderer.documentTag(result[req.uriParams.documentId]["tag"][req.uriParams.tagId]));
					return next();
				}
			});
		},
		

		getAllByLink : function(req, res, next) {
			h.util.dbFetcher.fetchLinkResources(["link",req.uriParams.linkId, "tag"],function(err, result){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(h.util.empty(result)){
					//empty result, so check if document exists at all
					h.util.dbFetcher.exist(req.uriParams.documentId, h.c.DOCUMENT, function(code){
						if(code === 200){
							res.send(200, h.util.renderer.linkTagList(req.uriParams.linkId,{}));
							return next();
						}
						else if(code === 404){
							h.responses.error(404,"Link not found.",res,next);
						}
						else{
							h.responses.error(500,"Internal server error.",res,next);
						}
					});
				}
				else{
					res.send(200, h.util.renderer.linkTagList(req.uriParams.linkId,result[req.uriParams.linkId]["tag"]));
					return next();
				}
			});
		},
		
		getByLink : function(req, res, next) {
			h.util.dbFetcher.fetchLinkResources(["link",req.uriParams.linkId, "tag", req.uriParams.tagId],function(err, result){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(h.util.empty(result)){
					h.responses.error(404,"Tag not found.",res,next);
				}
				else{
					res.send(200, h.util.renderer.linkTag(result[req.uriParams.linkId]["tag"][req.uriParams.tagId]));
					return next();
				}
			});
		}

	};
};