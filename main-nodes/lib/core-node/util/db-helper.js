require("rfc3339date");

module.exports = function(h){
	
	var DELIMITER = "~";
	
	var PART_DELIMITER = "_";
	
	var createTimeId = function(before, after){
		return ""+Date.parseRFC3339(after).getTime()+DELIMITER+Date.parseRFC3339(before).getTime();
	};

	var createLocationId = function(lat,lon,variance){
		return ""+lat+DELIMITER+lon+DELIMITER+variance;
	};
	
	var concat = function(){
		var s = arguments[0] || "" ;
		for( var i = 1; i < arguments.length; i++ ) {
			s = s + PART_DELIMITER + arguments[i];
		}
		return s;
	}
	
	return {
		createTimeId : createTimeId,
		createLocationId : createLocationId,
		concat : concat
	};
	
};