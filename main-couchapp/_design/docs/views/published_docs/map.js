/**
 * A simple view that emits only document fully published (enabled, no upload pending)
 */
function(doc) {
	if(doc.type === "document" && doc.enabled === true){
		emit(doc.documentId, null);
	}
}