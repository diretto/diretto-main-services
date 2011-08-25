module.exports = (function() {
	
	var DELIMITER = "-";

	var docTypes = [ 
	                [ "document", "d" ],
	                [ "query", "q" ],
	                [ "basetag", "b" ],
	                [ "attachment", "a" ],
	                [ "comment", "c" ],
	                [ "tag", "t" ],
	                [ "user", "u" ],
	                [ "link", "l" ],
	                [ "keyvalue", "k" ],
	                [ "time", "o" ],
	                [ "location", "x" ],
	                [ "snapshot", "s" ],
	                [ "collection", "n" ],
	                [ "message", "m" ],
	                [ "document", "d" ],
	                [ "vote", "v" ],
	                [ "query", "q" ],
	                [ "collectiondocument", "p" ]
     ];

	var c = {};
	
	docTypes.forEach(function(docType){
		var key = docType[0].toUpperCase();
		
		var docPrefix = docType[1]+DELIMITER;
		
		c[key] = {
			TYPE : docType[0],
			PREFIX : docType[1],
			wrap : function(id){
				return docPrefix+id;
			},
			unwrap : function(docId){
				return docId.substring(docPrefix.length);
			}
		};		
	});

	return c;
}());
