/*global MochaWeb, describe, it, chai */
'use strict';

if (typeof MochaWeb !== 'undefined') {
	MochaWeb.testOnly(function() {
		describe('Server initialization', function() {
			it('should have a Meteor version defined', function() {
				chai.assert(Meteor.release);
			});
		});
	});
}
