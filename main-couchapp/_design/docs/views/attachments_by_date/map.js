/**
 * Attachments ordered by time.
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "attachment"){
		emit([doc.publishedTime, doc.attachmentId], null);
	}
}