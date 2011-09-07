/**
 * diretto Feed Service Node
 * 
 * @author Benjamin Erb
 * 
 */

var path = require('path');

require.paths.push(path.join(__dirname, 'lib'));
require.paths.push(path.join(__dirname, 'vendor'));


var direttoUtil = require('diretto-util');
var FeedNode = require('feed-node'); 

var config = {};
config['feed'] = direttoUtil.readConfigFileSync(path.join(__dirname, 'conf', 'feed-node.json'));
config['common'] = direttoUtil.readConfigFileSync(path.join(__dirname, 'conf', 'common.json'));
config['registry'] = direttoUtil.readConfigFileSync(path.join(__dirname, 'conf', 'registry.json'));
config['mediatypes'] = direttoUtil.readConfigFileSync(path.join(__dirname, 'conf', 'mediatypes.json'));

var feedNode = FeedNode(config);
feedNode.bind();

//BAD THING, I know :-(
process.on('uncaughtException', function (err) {
	  console.log('ERROR: ' + err);
});