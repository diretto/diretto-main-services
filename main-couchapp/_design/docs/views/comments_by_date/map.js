/**
 * List of comments by time
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "comment"){
		emit([doc.creationTime, doc.commentId], null);
	}
}