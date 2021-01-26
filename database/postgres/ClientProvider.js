const assert = require('@barchart/common-js/lang/assert'),
	Disposable = require('@barchart/common-js/lang/Disposable');

module.exports = (() => {
	'use strict';

	/**
	 * An abstract class for generating Postgres {@link Client} instances.
	 *
	 * @public
	 * @abstract
	 * @param {String} host
	 * @param {String} database
	 * @param {String} username
	 * @param {String} password
	 * @param {Number=} port
	 * @param {String=} applicationName
	 */
	class ClientProvider extends Disposable {
		constructor(host, database, username, password, port, applicationName) {
			super();

			assert.argumentIsRequired(host, 'host', String);
			assert.argumentIsRequired(database, 'database', String);
			assert.argumentIsRequired(username, 'username', String);
			assert.argumentIsRequired(password, 'password', String);
			assert.argumentIsOptional(port, 'port', Number);
			assert.argumentIsOptional(applicationName, 'applicationName', String);

			this._configuration = {
				host: host,
				port: port || 5432,
				database: database,
				user: username,
				password: password,
				application_name: applicationName || 'pg-javascript-client'
			};
		}


		/**
		 * Creates a new Postgres {@link Client} instance.
		 *
		 * @public
		 * @returns {Promise<Client>}
		 */
		getClient() {
			return Promise.resolve()
				.then(() => {
					return this._getClient();
				});
		}

		_getClient() {
			return null;
		}

		/**
		 * Returns the provider configuration (e.g. host, port, etc).
		 *
		 * @public
		 * @returns {Object}
		 */
		getConfiguration() {
			return Object.assign({ }, this._configuration);
		}

		toString() {
			return '[ClientProvider]';
		}
	}

	return ClientProvider;
})();