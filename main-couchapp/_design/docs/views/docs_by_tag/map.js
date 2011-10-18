/**
 * List of documents by tag.
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "tag" && doc.tagType === "document"){
		emit([doc.baseTagId, doc.documentId], null);
	}
}