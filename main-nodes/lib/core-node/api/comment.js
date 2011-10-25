/**
 * Comment Handler
 * 
 * @author Benjamin Erb
 */

require("rfc3339date");

module.exports = function(h) {
	
	var BATCH_LIMIT = h.options.core.parameters.batchLimit || 50;
	var PAGINATION_SIZE = h.options.core.parameters.paginationSize || 20;


	var COMMENT_MIN_LENGTH = 3;
	var COMMENT_MAX_LENGTH = 1024;

	var validateComment = function(data, response, next, callback) {
		var failed = false;
		var fail = function(msg) {
			response.send(400, {
				error : {
					reason : "Invalid comment entity. " + (msg || "Please check your entity structure.")
				}
			});

			failed = true;
			next();
			return;
		};

		// Check main attributes
		if (data  === undefined || data.content === undefined ) {
			fail("Attributes are missing.");
			return;
		}

		//Check tag
		if (!(typeof (data.content) == 'string' && data.content.length >= COMMENT_MIN_LENGTH && data.content.length <= COMMENT_MAX_LENGTH)) {
			fail("Invalid comment.");
			return;
		}

		if (!failed) {
			callback({
				"content" : data.content
			});
		}
	};

	return {
		
		get : function(req, res, next) {
			h.util.dbFetcher.fetchDocumentResources(["document",req.uriParams.documentId, "comment", req.uriParams.commentId],function(err, result){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(h.util.empty(result)){
					h.responses.error(404,"Comment not found.",res,next);
				}
				else{
					res.send(200, h.util.renderer.comment(result[req.uriParams.documentId]["comment"][req.uriParams.commentId]));
					return next();
				}
			});
		},
		
		create : function(req, res, next) {
			validateComment(req.params, res, next, function(data) {
				var documentId = req.uriParams.documentId;
				h.util.dbFetcher.exist(documentId, h.c.DOCUMENT, function(code) {
					if (code === 200) {
						
						var commentId = h.uuid(); 
						
						var commentDoc = {
								_id : h.c.COMMENT.wrap(h.util.dbHelper.concat(documentId,commentId)),
								type : h.c.COMMENT.TYPE,
								commentId : commentId,
								documentId : documentId,
								creator : req.authenticatedUser,
								creationTime : new Date().toRFC3339UTCString(),
								content : data.content
						};
						
						h.db.save(commentDoc._id, commentDoc, function(err, dbRes) {
							if (err) {
								h.responses.error(500,"Internal server error. Please try again later.",res,next);
							}
							else {
								res.send(202, {
									"link" : h.util.link(h.util.uri.comment(documentId,commentId))
								}, {
									'Location' : h.util.uri.comment(documentId,commentId)
								});
								
								h.util.events.commentCreated({
									commentId : commentId,
									userId : req.authenticatedUser,
									documentId : documentId
								});
								
								return next();
							}
						});
						
					}
					else if (code === 404) {
						h.responses.error(404, "Document not found.", res, next);
						return;
					}
					else {
						h.responses.error(500, "Internal server error.", res, next);
						return;

					}
				});

			});			
		},
		
		forwardDocumentComments : function(req, res, next) {
			h.util.dbPaginator.forward("docs/comments_by_doc",[req.uriParams.documentId],function(row){
				return row.key[2];
			},function(err,cursor){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if ( cursor === null){
					res.send(204);
					return next();
				}
				else{
					var uri = h.util.uri.documentCommentPage(req.uriParams.documentId, cursor); 
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});	
		},
		
		listDocumentComments : function(req, res, next) {
			//fetch cursor doc
			h.util.dbFetcher.fetch(h.util.dbHelper.concat(req.uriParams.documentId,req.uriParams.cursorId), h.c.COMMENT, function(err,doc){
				if(err && err === 404){
					h.responses.error(404,"Cursor not found.",res,next);
					return;
				}
				else if(err){
					h.responses.error(500,"Internal server error.",res,next);
					return;
				}
				else{
					var key = [req.uriParams.documentId, doc.creationTime, req.uriParams.cursorId];
					var pageLink = h.util.uri.documentCommentPage;
					h.util.dbPaginator.getPage("docs/comments_by_doc", key, [req.uriParams.documentId], PAGINATION_SIZE, false, false, function(row){
						return {
							key : row.key[2],
						};
					}, function(err, result){
						if(err){
							res.send(500);
							next();
						}
						else{
							
							var list = result.list.map(function(row){
								return ["document", req.uriParams.documentId, "comment", row.key];
							});
							
							var related = [];
							["next", "previous"].forEach(function(e){
								if(result[e]){
									related.push({
										"link" : h.util.link(pageLink(req.uriParams.documentId, result[e].key), e)
									});
								}
							});
							
							var headers = {};
							if(result.etag){
								headers["Etag"] = '"'+result.etag+'"';
							}
							
							h.util.dbFetcher.fetchDocumentResourcesByKey(list,function(err, fetchResult){
								if(err){
									h.responses.error(500,"Internal server error.",res,next);
								}
								else if(h.util.empty(result)){
									h.responses.error(500,"Internal server error.",res,next);
								}
								else{
									var resultlist = result.list.map(function(row){
										return h.util.renderer.comment(fetchResult[req.uriParams.documentId]["comment"][row.key]);
									});
									
									res.send(200,{
										"page" : {
											"link" : h.util.link(pageLink(req.uriParams.documentId, req.uriParams.cursorId))
										},
										"list" :  resultlist,
										"related" : related
									});
									return next();
								}
							});						
						}
					});	
				}
			});		
		},
		
		forwardUserComments : function(req, res, next) {
			h.util.dbPaginator.forward("docs/comments_by_user",[req.uriParams.userId],function(row){
				return row.key[2];
			},function(err,cursor){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if ( cursor === null){
					res.send(204);
					return next();
				}
				else{
					var uri = h.util.uri.userCommentPage(req.uriParams.userId, cursor); 
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});		},
		
		listUserComments : function(req, res, next) {
			//fetch cursor doc
			h.db.view('docs/comments_by_id', {
				limit : 1,
				include_docs : true,
				key : req.uriParams.cursorId,
			}, function(err, dbRes) {
				if (dbRes && dbRes.length === 1) {
					var key = [req.uriParams.userId, dbRes[0].doc.creationTime, req.uriParams.cursorId];
					var pageLink = h.util.uri.userCommentPage;
					h.util.dbPaginator.getPage("docs/comments_by_user", key, [req.uriParams.userId], PAGINATION_SIZE, false, false, function(row){
						return {
							key : row.key[2],
							documentId : row.key[3]
						};
					}, function(err, result){
						if(err){
							res.send(500);
							next();
						}
						else{
							
							var list = result.list.map(function(row){
								return ["document", row.documentId, "comment", row.key];
							});
							
							var related = [];
							["next", "previous"].forEach(function(e){
								if(result[e]){
									related.push({
										"link" : h.util.link(pageLink(req.uriParams.userId, result[e].key), e)
									});
								}
							});
							
							var headers = {};
							if(result.etag){
								headers["Etag"] = '"'+result.etag+'"';
							}
							h.util.dbFetcher.fetchDocumentResourcesByKey(list,function(err, fetchResult){
								if(err){
									h.responses.error(500,"Internal server error.",res,next);
								}
								else if(h.util.empty(fetchResult)){
									h.responses.error(500,"Internal server error.",res,next);
								}
								else{
									var resultlist = result.list.map(function(row){
										return h.util.renderer.comment(fetchResult[row.documentId]["comment"][row.key]);
									});
									
									res.send(200,{
										"page" : {
											"link" : h.util.link(pageLink(req.uriParams.userId, req.uriParams.cursorId))
										},
										"list" :  resultlist,
										"related" : related
									});
									return next();
								}
							});						
						}
					});
				}
				else if (dbRes) {
					h.responses.error(404,"Cursor not found.",res,next);
					return;
				}
				else {
					h.responses.error(500,"Internal server error.",res,next);
					return;
				}
			});			
		}
	};
};