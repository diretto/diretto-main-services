/**
 * Generates a complex view of document-related entries. Does not emit values.
 * 
 * @author Benjamin Erb
 */
function(doc) {

	  if (doc.type === "link") {
		  emit(["link",doc.linkId,"link",doc.linkId],null);
	  }
	  else if (doc.type === "tag" && doc.tagType === "link") {
		  emit(["link",doc.linkId,"tag",doc.baseTagId],null);
	  }

};
