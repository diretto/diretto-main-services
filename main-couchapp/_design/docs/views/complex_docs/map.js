/**
 * Generates a complex view of document-related entries. Does not emit values.
 * 
 * @author Benjamin Erb
 */
function(doc) {

	  if (doc.type === "document" && doc.enabled === true) {
		  emit(["document",doc._id.substr(2),"document",doc._id.substr(2)],null);
	  }
	  else if (doc.type === "attachment" && doc.enabled === true) {
		  emit(["document",doc.documentId,"attachment",doc.attachmentId],null);
	  }
	  else if (doc.type === "comment") {
		  emit(["document",doc.documentId,"comment",doc.commentId],null);
	  }
	  else if (doc.type === "tag" && doc.tagType === "document") {
		  emit(["document",doc.documentId,"tag",doc.baseTagId],null);
	  }
	  else if (doc.type === "time") {
		  emit(["document",doc.documentId,"time",(""+doc.after+"--"+doc.before)],null);
	  }
	  else if (doc.type === "location") {
		  emit(["document",doc.documentId,"location",(""+doc.lat+","+doc.lon+","+doc.variance)],null);
	  }
	  else if (doc.type === "keyvalue") {
		  emit(["document",doc.documentId,"keyvalue",(""+doc.userId+"-"+doc.key)],null);
	  }
	  else if (doc.type === "link") {
		  emit(["document",doc.source.documentId,"link",doc.linkId],null);
		  emit(["document",doc.destination.documentId,"link",doc.linkId],null);
	  }
};
