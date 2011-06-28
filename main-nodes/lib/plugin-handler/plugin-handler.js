/**
 * A validator for checking plugin objects against a given "interface" struct.
 * 
 * @author Benjamin Erb
 */

var fs = require('fs');
var path = require('path');
var util = require('util');

/**
 * @returns
 */
var PluginHandler = module.exports.PluginHandler = function(template) {
	this.template = template;
};

/**
 * @param directory
 */
PluginHandler.prototype.loadAllPluginsSync = function(directory, overrideTemplate) {

	var plugins = {};
	
	var template = this.template;
	
	var files = fs.readdirSync(directory);
	for ( var i = 0; i < files.length; i++) {
		var stats = fs.statSync(path.join(directory, files[i]));
		if (stats.isDirectory() && files[i].charAt(0) !== '_') {
			var pluginFiles = fs.readdirSync(path.join(directory, files[i]));
			for ( var j = 0; j < pluginFiles.length; j++) {
				var pluginStats = fs.statSync(path.join(directory, files[i], pluginFiles[j]));
				if (pluginStats.isFile() && pluginFiles[j] === 'index.js') {
					var plugin = require(path.join(directory, files[i], pluginFiles[j])).Plugin;
					if(!plugins[files[i]]){
						plugins[files[i]] = {};	
					}					
					plugins[files[i]]['plugin'] = plugin;
				}
				if (pluginStats.isFile() && pluginFiles[j] === 'config.js') {
					var config = require(path.join(directory, files[i], pluginFiles[j])).config;
					if(!plugins[files[i]]){
						plugins[files[i]] = {};	
					}			
					plugins[files[i]]['config'] = config;
				}
			}
		}
		else if (!!overrideTemplate && stats.isFile() && files[i] === 'template.js') {
			template = require(path.join(directory, files[i])).template;
		}
	}

	var cleanPlugins = {};
	
	for ( var p in plugins) {
		if (plugins[p].plugin && this._validate(plugins[p].plugin, template)) {
			var id = plugins[p].plugin.id;
			cleanPlugins[id] = plugins[p].plugin;
			cleanPlugins[id].init( plugins[p].config || {});
		}
	}

	return cleanPlugins;
};

/**
 * @param directory
 */
PluginHandler.prototype.preloadAllPluginsSync = function(directory, overrideTemplate) {

	var plugins = {};
	
	var template = this.template;
	
	var files = fs.readdirSync(directory);
	for ( var i = 0; i < files.length; i++) {
		var stats = fs.statSync(path.join(directory, files[i]));
		if (stats.isDirectory() && files[i].charAt(0) !== '_') {
			var pluginFiles = fs.readdirSync(path.join(directory, files[i]));
			for ( var j = 0; j < pluginFiles.length; j++) {
				var pluginStats = fs.statSync(path.join(directory, files[i], pluginFiles[j]));
				if (pluginStats.isFile() && pluginFiles[j] === 'index.js') {
					var plugin = require(path.join(directory, files[i], pluginFiles[j])).Plugin;
					if(!plugins[files[i]]){
						plugins[files[i]] = {};	
					}					
					plugins[files[i]]['plugin'] = plugin;
				}
				if (pluginStats.isFile() && pluginFiles[j] === 'config.js') {
					var config = require(path.join(directory, files[i], pluginFiles[j])).config;
					if(!plugins[files[i]]){
						plugins[files[i]] = {};	
					}			
					plugins[files[i]]['config'] = config;
				}
			}
		}
		else if (!!overrideTemplate && stats.isFile() && files[i] === 'template.js') {
			template = require(path.join(directory, files[i])).template;
		}
	}

	var cleanPlugins = {};
	
	for ( var p in plugins) {
		if (plugins[p].plugin && this._validate(plugins[p].plugin, template)) {
			cleanPlugins[plugins[p].plugin.id] = function(idx){
					return function(){
						var a = plugins[idx].plugin; 
						var c = plugins[idx].config; 
						a.init(c || {});
						return a;
						
					};
				}(p);
		}
	}

	return cleanPlugins;
};

///**
// * 
// */
//PluginHandler.prototype.preloadAllPluginsSync = function(){
//	//TODO
//};

PluginHandler.prototype.loadPluginSync = function(directory, overrideTemplate) {

	var template = this.template;
	var config = {};

	if (overrideTemplate) {
		var p = path.normalize(path.join(directory, "..", "template.js"));
		try {
			var stat = fs.statSync(p);
			if (stat.isFile()) {
				template = require(p).template;
			}
		}
		catch (e) {
		}
	}

	try {
		var idxStat = fs.statSync(path.join(directory, "index.js"));
		if (idxStat.isFile()) {
			try {
				var cfgStat = fs.statSync(path.join(directory, "config.js"));
				if (cfgStat.isFile()) {
					config = require(path.join(directory, "config.js")).Config;
				}
			}
			catch (e) {
			}

			var plugin = require(path.join(directory, "index.js")).Plugin;
			if (plugin && this._validate(plugin, template)) {
				plugin.init(config);
				return plugin;
			}
			else {
				return null;
			}
		}
	}
	catch (e) {
		console.log(e);
		return null;
	}
};

/**
 * Validates an object by a given "interface" struct
 * 
 * @param o
 *            the object
 * @param i
 *            the interface
 * @return true if object matches to the interface
 */
PluginHandler.prototype._validate = function(o, i) {
	for ( var m in i) {
		if ((typeof o[m] !== typeof i[m])) {
			return false;
		}
	}
	return true;
};