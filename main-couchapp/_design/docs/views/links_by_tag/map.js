/**
 * List of links by tag.
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "tag" && doc.tagType === "link"){
		emit([doc.baseTagId, doc.linkId], null);
	}
}