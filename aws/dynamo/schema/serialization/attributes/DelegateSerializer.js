const assert = require('@barchart/common-js/lang/assert');

const AttributeSerializer = require('./AttributeSerialzer'),
	DataType = require('./../../definitions/DataType');

module.exports = (() => {
	'use strict';

	/**
	 * An {@link AttributeSerializer} that delegates it work.
	 *
	 * @public
	 * @extends {AttributeSerializer}
	 * @param {AttributeSerializer} - A serializer for the underlying type (e.g. string).
	 * @param {Function} serializeDelegate - The delegate which extracts the underlying value.
	 * @param {Function} serializeDelegate - The delegate which rehydrates the underlying value.
	 */
	class DelegateSerializer extends AttributeSerializer {
		constructor(baseSerializer, serializeDelegate, deserializeDelegate) {
			super();

			assert.argumentIsRequired(baseSerializer, 'baseSerializer', AttributeSerializer, 'AttributeSerializer');
			assert.argumentIsRequired(serializeDelegate, 'serializeDelegate', Function);
			assert.argumentIsRequired(deserializeDelegate, 'deserializeDelegate', Function);

			this._baseSerializer = baseSerializer;
			this._serializeDelegate = serializeDelegate;
			this._deserializeDelegate = deserializeDelegate;
		}

		serialize(value) {
			return this._baseSerializer.serialize(this._serializeDelegate(value));
		}

		deserialize(wrapper) {
			return this._deserializeDelegate(this._baseSerializer.deserialize(wrapper));
		}

		toString() {
			return '[DelegateSerializer]';
		}
	}

	return DelegateSerializer;
})();