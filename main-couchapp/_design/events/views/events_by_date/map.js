function(doc) {
	if(doc.type === "emit"){
		emit([doc.publishedTime, doc._id], null);
	}
}