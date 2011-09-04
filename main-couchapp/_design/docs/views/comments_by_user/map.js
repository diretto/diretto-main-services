function(doc) {
	if(doc.type === "comment"){
		emit([doc.creator, doc.creationTime, doc.commentId, doc.documentId], null);
	}
}