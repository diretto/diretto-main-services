function(doc) {
	if(doc.type === "attachment"){
		emit([doc.documentId, doc.publishedTime, "attachment", doc.attachmentId], null);
	}
	else if(doc.type === "comment"){
		emit([doc.documentId, doc.publishedTime, "comment", doc.commentId], null);
	}
}