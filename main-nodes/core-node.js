/**
 * diretto Core Service Node
 * 
 * @author Benjamin Erb
 * 
 */

var path = require('path');

require.paths.push(path.join(__dirname, 'lib'));
require.paths.push(path.join(__dirname, 'vendor'));


var direttoUtil = require('diretto-util');
var CoreNode = require('core-node'); 

var config = {};
config['core'] = direttoUtil.readConfigFileSync(path.join(__dirname, 'conf', 'core-node.json'));
config['common'] = direttoUtil.readConfigFileSync(path.join(__dirname, 'conf', 'common.json'));

var coreNode = CoreNode(config);
coreNode.bind();