function(doc) {
	if(doc.type === "comment"){
		emit(doc.commentId,null);
	}
}