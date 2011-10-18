/**
 * List of enabled documents by publisher and time.
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "document" && doc.enabled === true){
		emit([doc.publisher, doc.publishedTime, doc.documentId], null);
	}
}