function(doc) {
	if(doc.type === "snapshot" && doc.enabled === true){
		emit([doc.creationTime, doc.documentId], null);
	}
}