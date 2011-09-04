/**
 * Generates a flat view of link-related entries. Allows to fetch all related documents for a several keys. 
 * 
 * @author Benjamin Erb
 */
function(doc) {

	  if (doc.type === "link") {
		  emit(doc.linkId,["link",doc.linkId,"link",doc.linkId]);
	  }
	  else if (doc.type === "tag" && doc.tagType === "link") {
		  emit(doc.linkId,["link",doc.linkId,"tag",doc.baseTagId]);
	  }
};
