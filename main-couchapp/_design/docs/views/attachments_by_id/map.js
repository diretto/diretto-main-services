/**
 * List of all enabled attachments.
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "attachment" && doc.enabled === true){
		emit(doc.attachmentId,null);
	}
}