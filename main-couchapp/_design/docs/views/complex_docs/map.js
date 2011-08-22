/**
 * Generates a complex view of document-related entries. Does not emit values.
 * 
 * @author Benjamin Erb
 */
function(doc) {

	  if (doc.type === "document") {
		  emit([doc._id.substr(2),"document"],null);
	  }
	  else if (doc.type === "attachment") {
		  emit([doc.documentId,"attachment",doc.attachmentId],null);
	  }
	  else if (doc.type === "comment") {
		  emit([doc.documentId,"comment",doc.commentId],null);
	  }
	  else if (doc.type === "tag") {
		  emit([doc.documentId,"tag",doc.tagId],null);
	  }
	  else if (doc.type === "time") {
		  emit([doc.documentId,"time",(""+doc.after+"--"+before)],null);
	  }
	  else if (doc.type === "location") {
		  emit([doc.documentId,"location",(""+doc.lat+","+doc.lon+","+doc.variance)],null);
	  }
};
