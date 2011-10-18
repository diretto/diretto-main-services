/**
 * List of enabled documents by media type and time. 
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "document" && doc.enabled){
		emit([doc.mediaType, doc.publishedTime, doc.documentId], null);
	}
}