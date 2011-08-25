function(doc) {
	if(doc.type === "collectiondocument"){
		emit([doc.userId, doc.collectionId, doc.documentId], null);
	}
}