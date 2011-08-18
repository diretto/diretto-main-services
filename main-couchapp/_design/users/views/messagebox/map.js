/**
 * Provides a view of all task ids and their creation time.
 * 
 * @author Benjamin Erb
 */
function(doc) {
	
	  if (doc.type === "message") {
		  //inbox
		  if(!doc.receiverDeleted){
			  emit([doc.receiver,"inbox",doc.creationTime,doc._id.substr(2)]);
		  }
		  //outbox
		  if(!doc.senderDeleted){
			  emit([doc.sender,"outbox",doc.creationTime,doc._id.substr(2)]);
		  }
	  }
};
