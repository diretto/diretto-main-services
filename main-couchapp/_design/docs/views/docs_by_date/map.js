/**
 * List of enabled documents by time.
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "document" && doc.enabled === true){
		emit([doc.publishedTime, doc.documentId], null);
	}
}