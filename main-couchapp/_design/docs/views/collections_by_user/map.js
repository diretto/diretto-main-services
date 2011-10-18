/**
 * List of collections by user
 *
 * @author Benjamin Erb
 */

function(doc) {
	if(doc.type === "collection"){
		emit([doc.creator, (!!doc.nonpublic ? "private": "public"), doc.creationTime, doc.collectionId], null)
	}
}