function(doc) {
	if(doc.type === "keyvalue"){
		
		emit([doc.documentId, doc.userId, doc.key], null);
	}
}