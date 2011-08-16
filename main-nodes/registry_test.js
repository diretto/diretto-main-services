var path = require('path');

require.paths.push(path.join(__dirname, 'lib'));
require.paths.push(path.join(__dirname, 'vendor'));

var registryValidator = require('registry-validator');


registryValidator(["http://task.diretto.org/v2/","http://media.diretto.org/","http://localhost:8006/v2/"], function(x){
	console.dir(x);
});
