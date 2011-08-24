function(doc) {
	if(doc.type === "document" && doc.enabled === true){
		emit([doc.publishedTime, doc.documentId], null);
	}
}