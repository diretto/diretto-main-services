/**
 * diretto Storage Service Node
 * 
 * @author Benjamin Erb
 * 
 */

var path = require('path');

require.paths.push(path.join(__dirname, 'lib'));
require.paths.push(path.join(__dirname, 'vendor'));


var direttoUtil = require('diretto-util');
var StorageNode = require('storage-node'); 

var config = {};
config['common'] = direttoUtil.readConfigFileSync(path.join(__dirname, 'conf', 'common.json'));
config['storage'] = direttoUtil.readConfigFileSync(path.join(__dirname, 'conf', 'storage-node.json'));

console.dir(config);

var storageNode = StorageNode(config);
storageNode.bind();

//BAD THING, I know :-(
process.on('uncaughtException', function (err) {
	  console.log('ERROR: ' + err);
});