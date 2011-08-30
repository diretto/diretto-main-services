function(doc) {
	if(doc.type === "tag" && doc.tagType === "link"){
		emit([doc.baseTagId, doc.linkId], null);
	}
}