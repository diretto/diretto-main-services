/**
 * List of comments by id
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "comment"){
		emit(doc.commentId,null);
	}
}