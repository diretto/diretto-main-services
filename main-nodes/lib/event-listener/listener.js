/**
 * Glue code that generates events from CouchDB listener callbacks. 
 * 
 * @author Benjamin Erb
 * 
 */

var follow = require('follow');
var events = require('events');

module.exports = function(dbUri) {
	
	var emitter = new events.EventEmitter();
	emitter.setMaxListeners(20);
	
	follow({
			"db"  :dbUri ,
			"since" : "now",
			"include_docs" : true,
			"filter" : "events/events",
		}, function(error, change) {
		  if(!error) {
		    emitter.emit(change.doc.event.type, change.doc);
		  }
	});
	
	return {
		get : function(){
			return emitter;
		}
	}
};

