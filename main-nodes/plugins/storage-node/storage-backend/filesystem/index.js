var url = require('url');
var util = require('util');
var events = require("events");
var fs = require("fs");
var path = require('path');

/**
 * A backend storage implementation using the local file system.
 * 
 * @author Benjamin Erb
 */
exports.Plugin = {

	version : "0.1.0",

	author : "Benjamin Erb",

	name : "Filesystem Storage Backend",

	id : "media-node-fs-backend",

	init : function(options) {
		console.log("Initializing "+this.name);
		this.rootDir = options.rootDir || 'data/';
		this.mimeTable = require("./lib/mime").mime;
	},

	get : function(documentId, attachmentId, extension, etag, isHeadRequest) {

		var emitter = new events.EventEmitter();
		var that = this;

		process.nextTick(function() {

			var filePath = path.normalize(path.join(that.rootDir, documentId, attachmentId + "." + extension));
			if(filePath.indexOf(path.normalize(that.rootDir)) !== 0){
				emitter.emit("error", {
					'reason' : "not found"
				});
			}
			else{
				fs.stat(filePath, function(err, stats) {
					if (err || !stats.isFile()) {
						emitter.emit("error", {
							'reason' : "not found"
						});
						console.log(err);
					}
					else {
						var fileEtag = '"' + stats.ino + '-' + stats.size + '-' + Date.parse(stats.mtime) + '"';
						var fileSize = stats.size;
						var mimeType = that.mimeTable[extension] || "application/octet";
						console.log(extension+"\t"+mimeType);
	
						var metaData = {
							'Etag' : fileEtag,
							'Content-Length' : fileSize,
							'Content-Type' : mimeType
						};
	
						emitter.emit("metadata", metaData, (etag && etag === fileEtag ? 304 : 200));
	
						if (!isHeadRequest && (fileEtag !== etag)) {
							emitter.emit("data", fs.createReadStream(filePath));
						}
					}
				});
			}
		});
		return emitter;
	},

	put : function(documentId, attachmentId, extension, mimeType, size, readableStream) {
		var emitter = new events.EventEmitter();
		var that = this;

		readableStream.pause();
		
		process.nextTick(function() {
			
			var filePath = path.normalize(path.join(that.rootDir, documentId, attachmentId + "." + extension));
			if(filePath.indexOf(path.normalize(that.rootDir)) !== 0){
				emitter.emit("error", {
					'reason' : "not found"
				});
			}
			else{
				
				var writeFile = function(){

					var writeStream = fs.createWriteStream(filePath);
					writeStream.on('open', function(fd) {

						readableStream.on("data", function(chunk) {
							if (writeStream.write(chunk) === false) {
								readableStream.pause();
							}
						});

						writeStream.on('error', function(err) {
							emitter.emit("error", {
								'reason' : "internal"
							});
						});

						writeStream.on("drain", function() {
							readableStream.resume();
						});

						readableStream.on("end", function() {
							writeStream.removeAllListeners("drain");
							writeStream.once("drain", function() {
								emitter.emit("success");
							});
						});
						readableStream.resume();
					});
					
				};
				
				
				path.exists(filePath, function (exists) {
					if(exists){
						emitter.emit("error", {
							'reason' : "conflict"
						});
					}
					else{
						path.exists(path.dirname(filePath), function(exists){
							if (exists) {
								writeFile();
							}
							else {
								that.createDirectoryPath(path.normalize(path.dirname(filePath)), path.normalize(that.rootDir), function(err){
									if(err){
										emitter.emit("error");
									}
									else{
										writeFile();
									}
								});
							}
						});
					}
				});
			}
		});
		
		return emitter;
	},
	

	createDirectoryPath : function(targetPath, currentPath, callback) {
		var that = this;
		
		//remove trailing slashes
		currentPath = currentPath.replace(/(\/)+$/g,"");
		targetPath = targetPath.replace(/(\/)+$/g,"");

		console.log("t: "+targetPath);
		console.log("c: "+currentPath);
		
		if (targetPath.indexOf(currentPath) !== 0) {
			callback({
				'reason' : "Path mismatch"
			});
		}
		else if(targetPath === currentPath){
			callback();
		}
		else{
			//[1] because substring will create trailling "/"
			var nextPath = path.join(currentPath,targetPath.substring(currentPath.length).split('/')[1]);
			
			path.exists(nextPath,function(exists){
				if(exists){
					that.createDirectoryPath(targetPath, nextPath, callback);
				}else{
					fs.mkdir(nextPath, 0777, function(err){
						if(err){
							callback({
								'reason' : "mkdir Error"
							});
						}
						else{
							that.createDirectoryPath(targetPath, nextPath, callback);
						}
					});
				}
			});
		}
	}
};