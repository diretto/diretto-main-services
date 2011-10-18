/**
 * List of links by date.
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "link"){
		emit([doc.creationTime, doc.linkId], null);
	}
}