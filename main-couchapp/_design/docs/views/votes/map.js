/**
 * List of votes by resource. The value is a number representing the vote (1: up, -1: down).
 * 
 * Can be used with a builtin reduce function to in order to calculate the numbers of total votes, up votes, down votes
 * as a single grouped result.
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "vote"){
	
		if(doc.resourceType === "attachment"){
			emit(["document", doc.documentId, doc.resourceType, doc.attachmentId], doc.vote);
		}
		else if(doc.resourceType === "comment"){
			emit(["document", doc.documentId, doc.resourceType, doc.commentId], doc.vote);
		}
		else if(doc.resourceType === "time"){
			emit(["document", doc.documentId, doc.resourceType, doc.time], doc.vote);
		}
		else if(doc.resourceType === "location"){
			emit(["document", doc.documentId, doc.resourceType, doc.location], doc.vote);
		}
		else if(doc.resourceType === "documenttag"){
			emit(["document", doc.documentId, "tag", doc.tagId], doc.vote);
		}
		else if(doc.resourceType === "link"){
			//adjust key length by emitting link id twice
			emit(["link", doc.linkId, doc.resourceType, doc.linkId], doc.vote);
		}
		else if(doc.resourceType === "linktag"){
			emit(["link", doc.linkId, "tag", doc.tagId], doc.vote);
		}

	}
}