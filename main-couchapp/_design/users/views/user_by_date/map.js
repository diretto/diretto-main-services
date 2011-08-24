/**
 * Provides a view of all user ids and their creation time.
 * 
 * @author Benjamin Erb
 */
function(doc) {
	
	  if (doc.type === "user" && doc.enabled === true) {
		  emit([doc.creationTime , doc._id.substr(2)], doc.username);		  
	  }
};
