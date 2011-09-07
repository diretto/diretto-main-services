function(doc) {
	if(doc.type === "snapshot"){
		emit([doc.creationTime, doc.documentId], null);
	}
}