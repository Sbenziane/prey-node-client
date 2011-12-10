var util = require('util'),
		emitter = require('events').EventEmitter,
		Hardware = require('../../lib/providers/hardware');

var HardwareScan = function(options){

	var self = this;

	this.get_info = function(){

		var data = {};

		Hardware.getters.forEach(function(info){

			Hardware.get(info, function(result){

				data[info] = result;

			});

		});

		// console.log(data);
		self.emit('hardware_scanned', data);
		self.emit('end', true);

	};

};

util.inherits(HardwareScan, emitter);

exports.start = function(options, callback){
	var scanner = new HardwareScan(options, callback);

	// call the callback first so the hardware_scanned promise gets hooked
	callback(scanner);
	scanner.get_info(options);
};

exports.events = ['hardware_scanned'];
