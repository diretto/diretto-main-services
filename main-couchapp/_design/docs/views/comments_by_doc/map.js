function(doc) {
	if(doc.type === "comment"){
		emit([doc.documentId, doc.creationTime, doc.commentId], null);
	}
}