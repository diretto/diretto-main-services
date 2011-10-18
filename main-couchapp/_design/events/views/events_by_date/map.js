/**
 * List of events by time.
 * 
 *  @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "event"){
		emit([doc.publishedTime, doc._id], null);
	}
}