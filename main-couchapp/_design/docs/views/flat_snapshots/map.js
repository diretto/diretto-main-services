/**
 * Generates a flat view of document-related entries, based on the snapshot values. 
 *
 *
 * @author Benjamin Erb
 */

function(doc) {

	  if (doc.type === "snapshot") {
		  emit(doc.documentId,["document",doc.documentId,"document",doc.documentId]);
		  emit(doc.documentId,["document",doc.documentId,"attachment",doc.documentId]);
		  emit(doc.documentId,["document",doc.documentId,"time",(""+doc.time.after+"--"+doc.time.before)]);
		  emit(doc.documentId,["document",doc.documentId,"location",(""+doc.location.lat+","+doc.location.lon+","+doc.location.variance)]);
		  
		  doc.tags.forEach(function(tagId){
			  emit(doc.documentId,["document",doc.documentId,"tag",tagId]);
		  });
	  }
};
