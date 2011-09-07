function(doc) {
	if(doc.type === "comment"){
		emit([doc.creationTime, doc.commentId], null);
	}
}