/**
 * List of tag, ordered by internal id (hash).
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "basetag"){
		emit([doc.baseTagId], doc.value);
	}
}