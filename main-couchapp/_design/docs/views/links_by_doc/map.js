/**
 * List of links by document and direction. 
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "link"){
		emit([doc.source.documentId, "out", doc.linkId], null);
		emit([doc.destination.documentId, "in", doc.linkId], null);
	}
}