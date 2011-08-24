function(doc) {
	if(doc.type = "document" && doc.enabled){
		emit([doc.documentId, doc.mediaType], null);
	}
}