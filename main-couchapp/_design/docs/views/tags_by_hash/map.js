function(doc) {
	if(doc.type === "basetag"){
		emit([doc.baseTagId], doc.value);
	}
}