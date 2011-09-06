require("rfc3339date");

module.exports = function(h) {
	
	var options = h.options.core;

	var MIN_TITLE_LENGTH = 3;
	var MAX_TITLE_LENGTH = 128;

	var MAX_DESC_LENGTH = 1024;
	var MAX_LCNS_LENGTH = 256;
	
	
	var uuidPattern = /[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/;
	
	var validateUUID = function(uuid){
		if((typeof uuid === "string") && uuid.match(uuidPattern)){
			return true;
		}
		else{
			return false;
		}
	};

	/**
	 * Takes a list of persons (creators, contributers), and validates them
	 * Returns lists of invalid(0) and valid(1) entries
	 */
	var validatePersonList = function(list) {
		var valid= [];
		var invalid = [];
		
		list.forEach(function(item){
			if(item.external){
				if(item.external.name && (typeof item.external.name === "string") && item.external.name.length > 0 && (item.external.link !== undefined)){
					var link = null;
					if(item.external.link && item.external.link.href && (typeof item.external.link.href === "string")){
						link = h.util.link(item.external.link.href);
					}
					valid.push({
						external : {
							name  : item.external.name,
							link : link
						}
					});
				}
			}
			else if(item.user){
				if(item.user.link && item.user.link.href && h.util.uriParser.extractUserId(item.user.link.href) !== null){
					valid.push({
						user : {
							link : {
								rel: "self",
								href : item.user.link.href
							}
						}
					});
				}
				else{
					invalid.push(item);
				}
			}
			else{
				invalid.push(item);
			}
		});
		
		return [invalid, valid];
	};
	
	var flattenPersonList = function(list){
		var user = [];
		var external = [];
		
		list.forEach(function(p){
			if(p.external){
				external.push({
					name : p.external.name,
					link : (p.external.link && p.external.link.href ? p.external.link.href : null)
				});
			}
			else if(p.user){
				user.push(h.util.uriParser.extractUserId(p.user.link.href).userId);				
			}
		})
		
		return {
			user : user,
			external : external				
		};
	}

	/**
	 * Tasks a date and returns true if valid and false otherwise.
	 */
	var validateDate = function(date) {
		if (Date.parseRFC3339(date) === undefined) {
			return false;
		}
		else{
			return true;
		}
	};

	/**
	 * Tasks a location and returns true if valid and false otherwise.
	 */
	var validateLocation = function(location) {
		//TODO:
		return true;
	};

	/**
	 * Tasks a location and returns true if valid and false otherwise.
	 */
	var validateLocationValues = function(lat,lon,variance) {
		//TODO:
		return true;
	};

	/**
	 * Validates a document creation request. Uses attachment validation internally.
	 */
	var validateDocumentData = function(docData, response, next, callback) {
		var fail = function(msg) {
			h.responses.error(400, "Invalid entity. " + (msg || "Please check your entity structure."), response, next);
		};
		
		validateAttachmentData(docData, response,next, function(validatedData){
			if(!docData.location || !validateLocation(docData.location)){
				fail("Invalid location");
				return;
			}
			else{
				validatedData['location'] = docData.location;
			}
			
			if(!docData.createdBetween || !docData.createdBetween.before || !docData.createdBetween.after){
				fail("Invalid creation time range");
				return;
			}
			if((!validateDate(docData.createdBetween.after)) || (!validateDate(docData.createdBetween.before))){
				fail("Invalid date format. Please use the whole RFC3339 format.");
				return;
			}
			validatedData['createdBetween'] = {};
			if(Date.parseRFC3339(docData.createdBetween.after).getTime() > Date.parseRFC3339(docData.createdBetween.before).getTime()){
				validatedData.createdBetween['after'] = docData.createdBetween.before;
				validatedData.createdBetween['before'] =  docData.createdBetween.after;
			}
			else{
				validatedData.createdBetween['before'] = docData.createdBetween.before;
				validatedData.createdBetween['after'] =  docData.createdBetween.after;
			}
			
			callback(validatedData);
		});
	};

	var validateAttachmentData = function(data, response, next, callback) {
		var fail = function(msg) {
			h.responses.error(400, "Invalid entity. " + (msg || "Please check your entity structure."), response, next);
		};

		if (!data || !data.title || !data.description || !data.mimeType || !data.creators || !data.contributors || !data.license) {
			fail("Attributes are missing.");
			return;
		}

		if ((typeof data.title !== "string") || (data.title.length < MIN_TITLE_LENGTH) || (data.title.length > MAX_TITLE_LENGTH)) {
			fail("Invalid title");
			return;
		}
		if ((typeof data.description !== "string") || (data.description.length > MAX_DESC_LENGTH)) {
			fail("Invalid description");
			return;
		}
		if ((typeof data.license !== "string") || (data.license.length > MAX_LCNS_LENGTH)) {
			fail("Invalid license");
			return;
		}
		if ((typeof data.mimeType !== "string") || (data.mimeType.indexOf('/') === -1)) {
			fail("Invalid MIME Type");
			return;
		}
		if (data.external) {
			if ((typeof data.external !== "string") || (data.description.length < 1)) {
				fail("Invalid external source.");
				return;
			}
		}
		else if (data.fileSize) {
			if ((typeof data.fileSize !== "number") || (data.fileSize < 1)) {
				fail("No valid attachment size");
				return;
			}

		}
		else {
			fail("No attachment type found.");
			return;
		}

		var parsedContributors = validatePersonList(data.contributors);
		if (parsedContributors[0].length > 1) {
			fail("Invalid contributors entries.");
			return;
		}

		var parsedCreators = validatePersonList(data.creators);
		if (parsedCreators[0].length > 1) {
			fail("Invalid creators entries.");
			return;
		}

		var result = {
			title : data.title,
			description : data.description,
			license : data.license,
			mimeType : data.mimeType,
			creators : parsedCreators[1],
			contributors : parsedContributors[1]
		};
		if (data.external) {
			result['external'] = data.external;
		}
		else if (data.fileSize) {
			result['fileSize'] = data.fileSize;
		}
		callback(result);

	};

	return {
		validateDocumentData : validateDocumentData,
		validateUUID : validateUUID,
		validateAttachmentData : validateAttachmentData,
		
		validateDate : validateDate,
		validateLocation  : validateLocation,
		validateLocationValues : validateLocationValues,
		
		flattenPersonList : flattenPersonList
	};
};