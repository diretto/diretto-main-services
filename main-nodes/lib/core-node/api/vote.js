module.exports = function(h) {

	/**
	 * Constants for votable resource types
	 */
	var RESOURCE = {
			ATTACHMENT : 1,	
			COMMENT : 2,	
			DOCUMENTTAG : 3,	
			LINKTAG : 4,	
			LINK : 5,	
			TIME : 6,	
			LOCATION : 7	
	};
		
	/**
	 * Constants for possible votes
	 */
	var VOTE = {
			UP : 1,
			DOWN : 2
	}

	/**
	 * Returns a textual description of a resource constant.
	 */
	var getResourceName = function(type){
		switch (type) {
			case RESOURCE.ATTACHMENT: return h.c.ATTACHMENT.TYPE;
			case RESOURCE.COMMENT: return h.c.COMMENT.TYPE;
			case RESOURCE.DOCUMENTTAG: return h.c.DOCUMENT.TYPE+h.c.TAG.TYPE;
			case RESOURCE.LINKTAG: return h.c.LINK.TYPE+h.c.TAG.TYPE;
			case RESOURCE.LINK: return h.c.LINK.TYPE;
			case RESOURCE.TIME: return h.c.TIME.TYPE;
			case RESOURCE.LOCATION: return h.c.LOCATION.TYPE;
			default: return null;
		}
	}
	
	/**
	 * Identifies the votable resource type by the URI
	 */
	var idResourceType = function(req){
		if(req.uriParams.documentId && req.uriParams.attachmentId){
			return RESOURCE.ATTACHMENT;
		}
		else if(req.uriParams.documentId && req.uriParams.commentId){
			return RESOURCE.COMMENT;
		}
		else if(req.uriParams.documentId && req.uriParams.tagId){
			return RESOURCE.DOCUMENTTAG;
		}
		else if(req.uriParams.linkId && req.uriParams.tagId){
			return RESOURCE.LINKTAG;
		}
		else if(req.uriParams.linkId){
			return RESOURCE.LINK;
		}
		else if(req.uriParams.documentId && req.uriParams.time){
			return RESOURCE.TIME;
		}
		else if(req.uriParams.documentId && req.uriParams.location){
			return RESOURCE.LOCATION;
		}
		else{
			return 0;
		}
	}
	
	/**
	 * Identifies the vote type by URI
	 */
	var idVoteType = function(req){
		if(req.uriParams.vote && req.uriParams.vote === "up"){
			return VOTE.UP;
		}
		else if(req.uriParams.vote && req.uriParams.vote === "down"){
			return VOTE.DOWN;
		}
		else{
			return 0;
		}
	};
	
	
	
	var buildResourceId = function(req){
		var type = idResourceType(req)
		switch (type) {
			case RESOURCE.ATTACHMENT:
				return {
					type : h.c.ATTACHMENT,
					id : h.util.dbHelper.concat(req.uriParams.documentId,req.uriParams.attachmentId)	
				}; 
			case RESOURCE.COMMENT: 
				return {
					type : h.c.COMMENT,
					id : h.util.dbHelper.concat(req.uriParams.documentId,req.uriParams.commentId)	
				}; 
			case RESOURCE.DOCUMENTTAG: 
				return {
					type : h.c.TAG,
					id : h.util.dbHelper.concat(req.uriParams.documentId,req.uriParams.tagId)	
				}; 
			case RESOURCE.LINKTAG: 
				return {
					type : h.c.TAG,
					id : h.util.dbHelper.concat(req.uriParams.linkId,req.uriParams.tagId)	
				}; 
			case RESOURCE.LINK:
				return {
					type : h.c.LINK,
					id : h.util.dbHelper.concat(req.uriParams.linkId)	
				}; 
			case RESOURCE.TIME:
				return {
					type : h.c.TIME,
					id : h.util.dbHelper.concat(req.uriParams.documentId,req.uriParams.time)	
				}; 
			case RESOURCE.LOCATION: 
				return {
					type : h.c.LOCATION,
					id : h.util.dbHelper.concat(req.uriParams.documentId,req.uriParams.location)	
				}; 
			default:
				return null;
		}	
	};
	
	/**
	 * 
	 */
	var buildVoteId = function(req){
		var voteType = idVoteType(req);
		var resourceType = idVoteType(req);
		if(!voteType || !resourceType){
			return null;
		}
		var resId = buildResourceId(req);
		return h.c.VOTE.wrap(h.util.dbHelper.concat(req.authenticatedUser,resId.type.wrap(resId.id) ));
	};
	
	var setResourceProperties = function(req, doc){
		var type = idResourceType(req)
		switch (type) {
			case RESOURCE.ATTACHMENT: 
				doc['documentId'] = req.uriParams.documentId;
				doc['attachmentId'] = req.uriParams.attachmentId;
				break;
			case RESOURCE.COMMENT: 
				doc['documentId'] = req.uriParams.documentId;
				doc['commentId'] = req.uriParams.commentId;
				break;
			case RESOURCE.DOCUMENTTAG: 
				doc['documentId'] = req.uriParams.documentId;
				doc['tagId'] = req.uriParams.tagId;
				break;
			case RESOURCE.LINKTAG: 
				doc['linkId'] = req.uriParams.linkId;
				doc['tagId'] = req.uriParams.tagId;
				break;
			case RESOURCE.LINK:
				doc['linkId'] = req.uriParams.linkId;
				break;
			case RESOURCE.TIME:
				doc['documentId'] = req.uriParams.documentId;
				doc['location'] = req.uriParams.location;
				break;
			case RESOURCE.LOCATION: 
				doc['documentId'] = req.uriParams.documentId;
				doc['time'] = req.uriParams.time;
				break;
			default:
		}		
	};
	
	
	return {

		getAll : function(req, res, next) {
			console.dir(idResourceType(req));
			console.dir(idVoteType(req));
			console.dir(req.uriParams);
			res.send(501);
			return next();
		},
		
		get : function(req, res, next) {
			console.dir(req.uriParams);
			res.send(501);
			return next();
		},
		
		cast : function(req, res, next) {
			
			var id = buildVoteId(req);
			var resourceType = idResourceType(req);
			var voteType = idVoteType(req);
			
			if(id === null){
				h.responses.error(400, "Invalid vote resource ", res, next);
			};
			if(!voteType){
				h.responses.error(400, "Invalid vote type ", res, next);
			}
			
			var voteDoc = {
					_id : id,
					type : h.c.VOTE.TYPE,
					creator : req.authenticatedUser,
					creationTime : new Date().toRFC3339UTCString(),
					vote : (voteType === VOTE.UP ? 1 : -1),
					resourceType : getResourceName(resourceType)
			};
			
			setResourceProperties(req, voteDoc);
			
			var resId = buildResourceId(req);
			
			console.dir(voteDoc);
			
			console.log(resId.id);
			h.util.dbFetcher.exist(resId.id, resId.type, function(code){
				if(code === 404){
					h.responses.error(404, "Votable resource not found ", res, next);
				}
				else if(code === 200){
					//TODO: fetch existing vote, if there
					h.db.save(voteDoc._id, voteDoc, function(err, dbRes) {
						if(err){
							h.responses.error(500,"Internal server error.",res,next);
						}
						else{
							res.send(202);
							return next();
						}
					});
				}
				else{
					h.responses.error(500,"Internal server error.",res,next);
				}
			});
		},
		
		
		undo : function(req, res, next) {
			//TODO: build vote ID
			//TODO: delete vote, if exsting
			console.dir(idResourceType(req));
			console.dir(idVoteType(req));
			console.dir(req.uriParams);
			res.send(501);
			return next();
		}

	};
};