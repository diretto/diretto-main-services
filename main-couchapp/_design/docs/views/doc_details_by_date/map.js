function(doc) {
	if(doc.type === "attachment"  && doc.enabled){
		emit([doc.documentId, doc.publishedTime, "attachment", doc.attachmentId], null);
	}
	else if(doc.type === "comment"){
		emit([doc.documentId, doc.creationTime, "comment", doc.commentId], null);
	}
}