function(doc) {
	if(doc.type === "tag" && doc.tagType === "document"){
		emit([doc.baseTagId, doc.documentId], null);
	}
}