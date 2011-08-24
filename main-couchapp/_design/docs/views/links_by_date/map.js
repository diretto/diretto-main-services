function(doc) {
	if(doc.type === "link"){
		emit([doc.creationTime, doc.linkId], null);
	}
}