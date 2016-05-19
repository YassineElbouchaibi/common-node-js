var _ = require('lodash');
var when = require('when');

var assert = require('common/lang/assert');

var Container = require('./../Container');
var PageEndpoint = require('./PageEndpoint');

module.exports = function() {
	'use strict';

	var PageContainer = Container.extend({
		init: function(port, path, secure, useSession, secureRedirect) {
			assert.argumentIsOptional(useSession, 'useSession', Boolean);
			assert.argumentIsOptional(secureRedirect, 'secureRedirect', Boolean);

			this._super(port, path, secure);

			this._useSession = useSession || false;
			this._secureRedirect = secureRedirect || false;
		},

		_getEndpointType: function() {
			return PageEndpoint;
		},

		getUsesSession: function() {
			return this._useSession;
		},

		getSecureRedirect: function() {
			return this._secureRedirect;
		},

		toString: function() {
			return '[PageContainer]';
		}
	});

	return PageContainer;
}();