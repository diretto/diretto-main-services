/**
 * List of documents by user collection
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "collectiondocument"){
		emit([doc.userId, doc.collectionId, doc.documentId], null);
	}
}