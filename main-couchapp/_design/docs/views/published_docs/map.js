/**
 * A simple view that emits only documents fully published (enabled, no upload pending).
 * 
 * @author Benjamin Erb 
 */

function(doc) {
	if(doc.type === "document" && doc.enabled === true){
		emit(doc.documentId, null);
	}
}