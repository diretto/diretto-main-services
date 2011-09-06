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
		var type = idResourceType(req);
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
				var dateRange = req.uriParams.time;
				var dates = dateRange.split("--");
				if(dates.length !== 2 || !h.util.commonValidator.validateDate(dates[0]) || !h.util.commonValidator.validateDate(dates[1])){
					return null;
				}				
				return {
					type : h.c.TIME,
					id : h.util.dbHelper.concat(req.uriParams.documentId,h.util.dbHelper.createTimeId(dates[1], dates[0]))	
				}; 
			case RESOURCE.LOCATION: 
				var location = req.uriParams.location;
				var locParts = location.split(",");
				if(locParts.length !== 3 || !h.util.commonValidator.validateLocationValues(locParts[0],locParts[1],locParts[2])){
					return null;
				}
				var lat = locParts[0];
				var lon = locParts[1];
				var variance = locParts[2];
				return {
					type : h.c.LOCATION,
					id : h.util.dbHelper.concat(req.uriParams.documentId, h.util.dbHelper.createLocationId(lat,lon,variance))	
				}; 
			default:
				return null;
		}	
	};
	
	/**
	 * 
	 */
	var buildVoteId = function(req){
		var resourceType = idResourceType(req);
		if(!resourceType){
			return null;
		}
		var resId = buildResourceId(req);
		return h.util.dbHelper.concat(req.authenticatedUser,resId.type.wrap(resId.id));
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
				doc['time'] = req.uriParams.time;
				break;
			case RESOURCE.LOCATION: 
				doc['documentId'] = req.uriParams.documentId;
				doc['location'] = req.uriParams.location;
				break;
			default:
		}		
	};
	
	
	return {

		getAll : function(req, res, next) {
			
			var resourceUri = "";
			var key = null;

			switch (idResourceType(req)) {
				case RESOURCE.ATTACHMENT: 
					resourceUri = h.util.uri.attachment(req.uriParams.documentId,req.uriParams.attachmentId);
					key = ["document",req.uriParams.documentId,"attachment",req.uriParams.attachmentId]
					break;
				case RESOURCE.COMMENT: 
					resourceUri = h.util.uri.comment(req.uriParams.documentId,req.uriParams.commentId);
					key = ["document",req.uriParams.documentId,"comment",req.uriParams.commentId]
					break;
				case RESOURCE.DOCUMENTTAG: 
					resourceUri = h.util.uri.documentTag(req.uriParams.documentId,req.uriParams.tagId);
					key = ["document",req.uriParams.documentId,"tag",req.uriParams.tagId]
					break;
				case RESOURCE.TIME:
					var dates = req.uriParams.time.split("--");
					resourceUri = h.util.uri.documentTime(req.uriParams.documentId,dates[0] ||0,dates[1]||0);
					key = ["document",req.uriParams.documentId,"time",req.uriParams.time]
					break;
				case RESOURCE.LOCATION: 
					var locs = req.uriParams.location.split(",");
					resourceUri = h.util.uri.documentLocation(req.uriParams.documentId,locs[0]||0,locs[1]||0,locs[2]||0);
					key = ["document",req.uriParams.documentId,"location",req.uriParams.location]
					break;
				case RESOURCE.LINKTAG: 
					resourceUri = h.util.uri.linkTag(req.uriParams.linkId,req.uriParams.tagId);
					key = ["link",req.uriParams.linkId,"tag",req.uriParams.tagId]
					break;
				case RESOURCE.LINK:
					resourceUri = h.util.uri.link(req.uriParams.linkId);
					key = ["link",req.uriParams.linkId,"link",req.uriParams.linkId]
					break;
				default:
					h.responses.error(404,"Unknown resource.",res,next);
					return;
					break;
			}
			
			resourceUri = resourceUri+"/votes";
			
			
			h.util.dbFetcher.fetchVotes(key, function(err, votes){				
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(votes === null){
					//check if resource exists
					var resId = buildResourceId(req);
										
					h.util.dbFetcher.exist(resId.id, resId.type, function(code){
						if(code === 404){
							h.responses.error(404, "Votable resource not found ", res, next);
						}
						else if(code === 200){
							res.send(200, {
								votes : {
									link : h.util.link(resourceUri),
									up : 0,
									down : 0,
								}
							
							});
							return next();
						}
						else{
							h.responses.error(500,"Internal server error.",res,next);
						}
					});
				}
				else{
					res.send(200, {
						votes : {
							link : h.util.link(resourceUri),
							up : votes.up,
							down : votes.down,
						}
					
					});
					return next();
				}
			});
		},
		
		get : function(req, res, next) {
			var id = buildVoteId(req);
			h.util.dbFetcher.fetch(id, h.c.VOTE, function(err, doc){
				if(err && err === 404){
					h.responses.error(404, "Vote not found ", res, next);
				}
				else if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else{
					res.send(200, {
						vote : (doc.vote === 1 ? "up" : "down")
					});
					return next();
					
				}
			});
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
					_id : h.c.VOTE.wrap(id),
					type : h.c.VOTE.TYPE,
					creator : req.authenticatedUser,
					creationTime : new Date().toRFC3339UTCString(),
					vote : (voteType === VOTE.UP ? 1 : -1),
					resourceType : getResourceName(resourceType)
			};
			
			setResourceProperties(req, voteDoc);
			
			var resId = buildResourceId(req);
			
			h.util.dbFetcher.exist(resId.id, resId.type, function(code){
				if(code === 404){
					h.responses.error(404, "Votable resourcex not found ", res, next);
				}
				else if(code === 200){
					
					var save = function(){
						h.db.save(voteDoc._id, voteDoc, function(err, dbRes) {
							if(err){
								h.responses.error(500,"Internal server error.",res,next);
							}
							else{
								res.send(202);
								return next();
							}
						});						
					};
					
					//fetch existing vote, if there
					h.util.dbFetcher.fetch(id,  h.c.VOTE, function(err, doc){
						if(err && err === 404){
							save();
						}
						else if(err){
							h.responses.error(500,"Internal server error.",res,next);
						}
						else{
							voteDoc._rev = doc._rev;
							save();
						}
					});
				}
				else{
					h.responses.error(500,"Internal server error.",res,next);
				}
			});
		},
		
		
		undo : function(req, res, next) {
			var id = buildVoteId(req);
			h.util.dbFetcher.fetch(id, h.c.VOTE, function(err, doc){
				if(err && err === 404){
					h.responses.error(404, "Vote not found ", res, next);
				}
				else if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else{
					h.db.remove(doc._id, doc._rev, function(err) {
						if (err) {
							h.responses.error(500, "Internal server error.", res, next);
							return;
						}
						else {
							res.send(204);
							return next();
						}
					});
				}
			});			
		}

	};
};