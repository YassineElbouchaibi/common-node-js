const assert = require('common/lang/assert');

const AttributeSerializer = require('./AttributeSerialzer'),
	DataType = require('./../../definitions/DataType');

module.exports = (() => {
	'use strict';

	/**
	 * Converts a number into (and back from) the representation used
	 * on a DynamoDB record.
	 */
	class NumberSerializer extends AttributeSerializer {
		constructor() {
			super();
		}

		serialize(value) {
			assert.argumentIsRequired(value, 'value', Number);

			const wrapper = { };

			wrapper[DataType.NUMBER.code] = this.coerce(value).toString();

			return wrapper;
		}

		deserialize(wrapper) {
			return this.coerce(wrapper[DataType.NUMBER.code]);
		}

		coerce(value) {
			return parseFloat(value);
		}

		toString() {
			return '[NumberSerializer]';
		}
	}

	return NumberSerializer;
})();