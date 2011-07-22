var path = require('path');
var util = require('util');
var http = require('http');
var url = require('url');
var fs= require('fs');

var formidable = require('formidable');

var PluginHandler = require('plugin-handler').PluginHandler;
var direttoUtil = require('diretto-util');
var Signer = require('signer');

module.exports = function(options) {

	var plugin = new PluginHandler();

	var SERVER_NAME = "diretto Media Node";
	var SERVER_VERSION = "0.2.0";

	var SERVER_SIGNATURE = SERVER_NAME + "/" + SERVER_VERSION;

	// Load auth plugin
	var auth = null;
	var auths = plugin.preloadAllPluginsSync(path.join(__dirname, '..', '..', 'plugins', 'common', 'auth'), true);
	if (auths[options.storage.auth.plugin]) {
		auth = auths[options.storage.auth.plugin]();
	}
	if (auth === null) {
		console.error("Could not initialize authentication plugin \"" + options.storage.auth.plugin + "\"");
		process.exit(-1);
	}

	// Load backend plugin
	var backend = null;
	var backends = plugin.preloadAllPluginsSync(path.join(__dirname, '..', '..', 'plugins', 'storage-node', 'storage-backend'), true);
	if (backends[options.storage.storage.backend]) {
		backend = backends[options.storage.storage.backend]();
	}
	if (backend === null) {
		console.error("Could not initialize storage backend \"" + this.options.storage.storage.backend + "\"");
		process.exit(-1);
	}

	var signer = Signer(options.common.security.salt);

	signer.signRequest("xx", "/0ecb3c6f-9ed9-41d0-ae40-ea074aeb1786/b54adc00-67f9-11d9-9669-0800200c9a66.jpg", 8313, "image/jpeg", function(e, token) {
		console.log(token);
	});

	signer.signResponse(201, "xx", "/0ecb3c6f-9ed9-41d0-ae40-ea074aeb1786/b54adc00-67f9-11d9-9669-0800200c9a66.jpg", function(e, token) {
		console.log(token);
	});

	// Stringify once
	var indexResource = JSON.stringify({
		"api" : {
			"name" : "org.diretto.api.main.storage",
			"version" : "v2"
		},
		"service" : {
			"version" : SERVER_VERSION,
			"name" : SERVER_NAME
		},
		"deployment" : {
			"title" : options.common.deployment.title || "",
			"contact" : options.common.deployment.contact || "",
			"website" : {
				"link" : {
					"rel" : "self",
					"href" : options.common.deployment.website || ""
				}
			}
		},
		"direttoMainServices" : {
			"core" : {
				"link" : {
					"rel" : "self",
					"href" : options.common.endpoints.core || ""
				}
			}
		},
		"links" : [ {
			"title" : "diretto Storage API Documentation",
			"link" : {
				"rel" : "self",
				"href" : "http://diretto.github.com/diretto-api-doc/v2/diretto/storage.html"
			}
		} ]
	});

	var _errorJSON = function(msg) {
		return '{"error":"' + msg + '"}';
	};

	var handleRequest = function(request, response) {

		var headers = {
			'Server' : SERVER_SIGNATURE,
			'Content-Type' : "application/json"
		};

		var requestUrl = url.parse(request.url, true);
		var result;
		if (requestUrl.pathname && (result = requestUrl.pathname.match(/^\/([-A-Za-z0-9]{36})(\/([-A-Za-z0-9]{36})\.([A-Za-z0-9]+))?$/))) {
			var documentId = result[1];
			if (result[2]) {
				var attachmentId = result[3];
				var attachmentExt = result[4];
				switch (request.method) {
					case 'GET':
						var e = backend.get(documentId, attachmentId, attachmentExt, request.headers['if-none-match'] || null);

						console.log(request.headers);

						e.once('error', function(err) {
							if (err.reason === 'not found') {
								response.writeHead(404, headers);
								response.write(_errorJSON("Attachment not found"));
								response.end();
							}
							else {
								response.writeHead(500, headers);
								response.write(_errorJSON("Internal error while fetching attachment"));
								response.end();
							}
						});

						e.once('metadata', function(metadata, code) {

							console.log(metadata);

							direttoUtil.mixin(headers, metadata);
							response.writeHead(code || 200, headers);
							if (code && code == 304) {
								response.end();
							}
						});

						e.once('data', function(stream) {
							stream.pipe(response);
						});

						break;

					case 'HEAD':

						var e = backend.get(documentId, attachmentId, attachmentExt, request.headers['etag'] || null, true);
						e.once('error', function(err) {
							if (err.reason === 'not found') {
								response.writeHead(404, headers);
								response.write(_errorJSON("Attachment not found"));
								response.end();
							}
							else {
								response.writeHead(500, headers);
								response.write(_errorJSON("Internal error while fetching attachment"));
								response.end();
							}
						});

						e.once('metadata', function(metadata, code) {
							direttoUtil.mixin(headers, metadata);
							response.writeHead(code || 200, headers);
							response.end();
						});
						break;

					case 'PUT':
						if (!requestUrl.query.token) {
							response.writeHead(400, headers);
							response.write(_errorJSON("Invalid request. Please provide the token for the upload"));
							response.end();
						}
						else {
							auth.authenticate(request, function(err, user) {
								if (err) {
									if (err.code && err.code === 401) {
										headers['WWW-Authenticate'] = 'Basic realm=diretto Media Node Access';
									}
									response.writeHead(err.code || 401, headers);
									response.write(_errorJSON(err.reason));
									response.end();
								}
								else {
									if (request.headers['content-length'] && request.headers['content-type']) {
										signer.signRequest(user, requestUrl.pathname, request.headers['content-length'], request.headers['content-type'], function(err, expectedToken) {
											if (err) {
												response.write(_errorJSON(err && err.reason || ""));
												response.end();
											}
											else {
												console.log(expectedToken);
												if (requestUrl.query.token === expectedToken) {
													var e = backend.put(documentId, attachmentId, attachmentExt, request.headers['content-type'] || "application/octet",
															request.headers['content-length'], request);
													e.once('error', function(err) {
														if (err && err.reason && err.reason === "conflict") {
															response.writeHead(409, headers);
														}
														else {
															response.writeHead(500, headers);
														}
														response.write(_errorJSON(err && err.reason || ""));
														response.end();
													});
													e.once('success', function() {
														headers['content-type'] = "application/json";
														response.writeHead(201, headers);
														signer.signResponse(201, user, requestUrl.pathname, function(err, token) {
															if (err) {
																response.write("{\"error\":\"internal\"}");
																response.end();
															}
															else {
																response.write("{\"successToken\":\"" + token + "\"}");
																response.end();
															}

														});
													});
												}
												else {
													response.writeHead(403, headers);
													response.write(_errorJSON("Invalid token, upload denied"));
													response.end();
												}
											}
										});
									}
									else if (!request.headers['content-length']) {
										response.writeHead(411, headers);
										response.write(_errorJSON("Content-Length is mandatory for uploads"));
										response.end();
									}
									else {
										response.writeHead(400, headers);
										response.write(_errorJSON("Incomplete upload request, please provide Content-Length and Content-Type."));
										response.end();
									}
								}
							});
						}
						break;

					// case 'DELETE':
					// break;

					default:
						response.writeHead(405, headers);
						response.end();
						break;
				}
				;
			}
			else {
				switch (request.method) {
					case 'POST':
						auth.authenticate(request, function(err, user) {
							if (err) {
								if (err.code && err.code === 401) {
									headers['WWW-Authenticate'] = 'Basic realm=diretto Media Node Access';
								}
								response.writeHead(err.code || 401, headers);
								response.write(_errorJSON(err.reason));
								response.end();
							}
							else {
								var form = new formidable.IncomingForm();
								var files = []; 
								var fields = {};
								
								var cleanup = function(){
									files.forEach(function(file){
										if(file[1].path){
											fs.unlink(file[1].path);
											console.log("deleting " +file[1].path );
										}
									});
								};
								
								var abort = function(code, msg){
									response.writeHead(code || 400, headers);
									response.write(_errorJSON(msg || "Invalid upload"));
									response.end();
								};

								form.uploadDir = options.storage.storage.tmpDir;

								form.on('field', function(field, value) {
									fields[field] = value;
								}).on('file', function(field, file) {
									files.push([ field, file ]);
								}).on('end', function() {
									
									//1 file? token and file?
									if(!fields.token || !fields.filename || files.length !== 1){
										abort();
										cleanup();
									}
									
									//check sign
									signer.signRequest(user, "/"+documentId+"/"+fields.filename, files[0][1].length, files[0][1].mime,function(err,token){
										console.dir(files);
										console.log("expected: " +token);
										console.log("got: " +fields.token);
										if(token === fields.token){
											
											var readStream = fs.createReadStream(files[0][1].path);
											readStream.once('open', function(fd){
												
												var attachmentExt = path.extname(fields.filename) || "";
												
												var attachmentId = path.basename(fields.filename, attachmentExt);
												
												var e = backend.put(documentId, attachmentId, attachmentExt, files[0][1].mime || "application/octet",
														files[0][1].length, readStream);
												e.once('error', function(err) {
													if (err && err.reason && err.reason === "conflict") {
														response.writeHead(409, headers);
													}
													else {
														response.writeHead(500, headers);
													}
													response.write(_errorJSON(err && err.reason || ""));
													response.end();
													cleanup();
												});
												e.once('success', function() {
													headers['content-type'] = "application/json";
													response.writeHead(201, headers);
													signer.signResponse(201, user, requestUrl.pathname, function(err, token) {
														if (err) {
															response.write("{\"error\":\"internal\"}");
															response.end();
														}
														else {
															response.write("{\"successToken\":\"" + token + "\"}");
															response.end();
														}

													});
													cleanup();
												});
											});
										}
										else{
											abort(403, "invalid token");
											cleanup();
										}
										
									});
								});
								form.parse(request);
							}
						});

						break;

					default:
						response.writeHead(405, headers);
						response.end();
						break;
				}
			}
		}
		else if (requestUrl.pathname === "/") {
			if (request.method === "HEAD" || request.method === "GET") {

				response.writeHead(200, headers);
				if (request.method === "GET") {
					response.write(indexResource);
				}
				response.end();
			}
			else {
				response.writeHead(405, headers);
				res.end();
			}
		}
		else {
			response.writeHead(404, headers);
			response.write(_errorJSON("Resource not found"));
			response.end();
		}
	};

	var server = http.createServer(handleRequest);

	return {

		bind : function() {
			server.listen(options.storage.bind.port || 8000, options.storage.bind.ip || "127.0.0.1");
		}

	};
};