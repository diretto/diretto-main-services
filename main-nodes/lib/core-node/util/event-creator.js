require("rfc3339date");

module.exports = function(h) {
	
	var c = {
			KEY_SET : "KEY_SET",
			KEY_REMOVED : "KEY_REMOVED",
			COMMENT_CREATED : "COMMENT_CREATED",
			DOCUMENT_CREATED : "DOCUMENT_CREATED", 
			ATTACHMENT_CREATED : "ATTACHMENT_CREATED", 
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
		 
	};
}