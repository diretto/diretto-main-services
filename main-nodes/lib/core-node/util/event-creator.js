require("rfc3339date");

module.exports = function(h) {
	
	var c = {
			KEY_SET : "KEY_SET",
			KEY_REMOVED : "KEY_REMOVED",
			COMMENT_CREATED : "COMMENT_CREATED",
			DOCUMENT_CREATED : "DOCUMENT_CREATED", 
			ATTACHMENT_CREATED : "ATTACHMENT_CREATED", 
			DOCUMENT_TAG_APPENDED : "DOCUMENT_TAG_APPENDED", 
			LINK_TAG_APPENDED : "LINK_TAG_APPENDED",
			LINK_CREATED : "LINK_CREATED",

			BASETAG_CREATED : "BASETAG_CREATED",

			LOCATION_ADDED : "LOCATION_ADDED",
			TIME_ADDED : "TIME_ADDED",
			
			VOTE_CASTED : "VOTE_CASTED",
			VOTE_REMOVED : "VOTE_REMOVED"
	};
	
	var noOp = function(){
		
	};
	
	var storeEvent = function(event, callback){
		
		console.log(event);
		
		var doc = {};
		
		doc._id = h.c.EVENT.wrap(h.uuid()); 
		doc.type = h.c.EVENT.TYPE;
		doc.event = event;
		
		doc.publishedTime =  new Date().toRFC3339UTCString();
		
		h.db.save(doc._id, doc, function(err){
			console.log(doc);
			callback(err);
		});
	};
	
	var locationAdded = function(data){
		if(data.documentId && data.lat && data.lon && data.variance && data.id){
			storeEvent({
				type : c.LOCATION_ADDED,
				documentId : data.documentId,
				lat : data.lat,
				lon : data.lon,
				variance : data.variance,
				id : data.id,
			}, noOp);
		}
	};
	
	var timeAdded = function(data){
		if(data.documentId && data.after && data.before && data.id){
			storeEvent({
				type : c.TIME_ADDED,
				documentId : data.documentId,
				after : data.after,
				before : data.before,
				id : data.id,
			}, noOp);
		}
	};
	
	var voteCasted = function(data){
		if(data.resource && data.userId && data.vote && data.resourceType && data.voteId){
			storeEvent({
				type : c.VOTE_CASTED,
				resource : data.resource,
				userId : data.userId,
				resourceType : data.resourceType,
				vote : data.vote,
				voteId : data.voteId,
			}, noOp);
		}
	};
		
	var voteRemoved = function(data){
		if(data.resource && data.userId && data.resourceType && data.voteId){
			storeEvent({
				type : c.VOTE_REMOVED,
				resource : data.resource,
				userId : data.userId,
				resourceType : data.resourceType,
				voteId : data.voteId,
			}, noOp);
		}
	};
	
	
	var baseTagCreated = function(data){
		if(data.baseTagId){
			storeEvent({
				type : c.BASETAG_CREATED,
				baseTagId : data.baseTagId
			}, noOp);
		}
	};
	
	var linkCreated = function(data){
		if(data.linkId && data.sourceDocumentId && data.destinationDocumentId){
			storeEvent({
				type : c.LINK_CREATED,
				linkId : data.linkId,
				sourceDocumentId : data.sourceDocumentId,
				destinationDocumentId : data.destinationDocumentId,
			}, noOp);
		}
	};
	
	var linkTagAppended = function(data){
		if(data.tagId && data.linkId){
			storeEvent({
				type : c.LINK_TAG_APPENDED,
				tagId : data.tagId,
				linkId : data.linkId
			}, noOp);
		}
	};	
	
	var documentTagAppended = function(data){
		if(data.tagId && data.documentId){
			storeEvent({
				type : c.DOCUMENT_TAG_APPENDED,
				tagId : data.tagId,
				documentId : data.documentId
			}, noOp);
		}
	};
	

	var documentCreated = function(data){
		console.log(data);
		if(data.userId && data.documentId && data.mediaType){
			storeEvent({
				type : c.DOCUMENT_CREATED,
				userId : data.userId,
				documentId : data.documentId,
				mediaType : data.mediaType
			}, noOp);
		}
	};
	
	var attachmentCreated = function(data){
		if(data.attachmentId && data.userId && data.documentId && data.mimeType){
			storeEvent({
				type : c.ATTACHMENT_CREATED,
				userId : data.userId,
				attachmentId : data.attachmentId,
				documentId : data.documentId,
				mimeType : data.mimeType
			}, noOp);
		}
	};
	
	var commentCreated = function(data){
		console.log(data);
		if(data.commentId && data.userId && data.documentId){
			storeEvent({
				type : c.COMMENT_CREATED,
				commentId : data.commentId,
				userId : data.userId,
				documentId : data.documentId
			}, noOp);
		}
	};
	
	var keySet = function(data){
		console.log(data);
		if(data.key && data.userId && data.documentId){
			storeEvent({
				type : c.KEY_SET,
				key : data.key,
				userId : data.userId,
				documentId : data.documentId
			}, noOp);
		}
	};
	
	var keyRemoved = function(data){
		console.log(data);
		if(data.key && data.userId && data.documentId){
			storeEvent({
				type : c.KEY_REMOVED,
				key : data.key,
				userId : data.userId,
				documentId : data.documentId
			}, noOp);
		}
	};
	
	return {
		attachmentCreated : attachmentCreated,
		documentCreated : documentCreated,		
		
		commentCreated : commentCreated,
		
		keySet : keySet,
		keyRemoved : keyRemoved,
		
		documentTagAppended : documentTagAppended,
		linkTagAppended : linkTagAppended,
		
		linkCreated : linkCreated,
		
		baseTagCreated : baseTagCreated,
		
		voteCasted : voteCasted,
		voteRemoved : voteRemoved,
		
		locationAdded  : locationAdded,
		timeAdded : timeAdded,
		 
	};
}