var Ractive    = require("./ractive-view.js" );
// Ractive.DEBUG  = config.ractive.debug;

var backboneAdaptor      = require( 'ractive-adaptors-backbone' );
backboneAdaptor.Backbone = require( 'backbone' );

module.exports = Ractive.extend({ adapt: [ backboneAdaptor ] });
