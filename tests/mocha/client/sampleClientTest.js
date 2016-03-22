/*global MochaWeb, describe, it, chai */
'use strict';

if (typeof MochaWeb !== 'undefined') {
	MochaWeb.testOnly(function() {
		describe('a group of tests', function() {
			it('should respect equality', function() {
				chai.assert.equal(5, 5);
			});
		});
	});
}
