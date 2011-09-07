function(doc) {
	if(doc.type = "document" && doc.enabled){
		emit([doc.mediaType, doc.publishedTime, doc.documentId], null);
	}
}