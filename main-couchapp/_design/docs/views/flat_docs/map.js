/**
 * Generates a flat view of document-related entries. Allows to fetch all related documents for a several keys. 
 * 
 * @author Benjamin Erb
 */
function(doc) {

	  if (doc.type === "document" && doc.enabled === true) {
		  emit(doc._id.substr(2),["document",doc._id.substr(2),"document",doc._id.substr(2)]);
	  }
	  else if (doc.type === "attachment") {
		  emit(doc.documentId, ["document",doc.documentId, "attachment", doc.attachmentId]);
	  }
	  else if (doc.type === "comment") {
		  emit(doc.documentId, ["document",doc.documentId, "comment", doc.commentId]);
	  }
	  else if (doc.type === "tag" && doc.tagType === "document") {
		  emit(doc.documentId, ["document",doc.documentId, "tag", doc.baseTagId]);
	  }
	  else if (doc.type === "time") {
		  emit(doc.documentId, ["document",doc.documentId, "time",(""+doc.after+"--"+doc.before)]);
	  }
	  else if (doc.type === "location") {
		  emit(doc.documentId, ["document",doc.documentId, "location",(""+doc.lat+","+doc.lon+","+doc.variance)]);
	  }
	  else if (doc.type === "link") {
		  emit(doc.source.documentId,["document",doc.source.documentId,"link",doc.linkId]);
		  emit(doc.destination.documentId,["document",doc.destination.documentId,"link",doc.linkId]);
	  }
};
