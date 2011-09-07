function(doc) {
	if(doc.type === "attachment"){
		emit([doc.publishedTime, doc.attachmentId], null);
	}
}