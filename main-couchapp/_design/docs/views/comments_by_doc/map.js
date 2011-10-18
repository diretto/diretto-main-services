/**
 * List of comments by document and time
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "comment"){
		emit([doc.documentId, doc.creationTime, doc.commentId], null);
	}
}