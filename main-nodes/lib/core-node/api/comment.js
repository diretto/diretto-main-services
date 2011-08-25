require("rfc3339date");

module.exports = function(h) {

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
		if (!data || !data.content) {
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
			res.send(501);
			return next();
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
					console.dir(cursor);
					
					var uri = h.util.uri.documentCommentPage(req.uriParams.documentId, cursor); 
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});	
		},
		
		listDocumentComments : function(req, res, next) {
			res.send(501);
			return next();
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
					console.dir(cursor);
					
					var uri = h.util.uri.userCommentPage(req.uriParams.userId, cursor); 
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});		},
		
		listUserComments : function(req, res, next) {
			res.send(501);
			return next();
		}

	};
};