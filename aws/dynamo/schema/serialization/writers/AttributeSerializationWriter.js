const assert = require('common/lang/assert'),
	attributes = require('common/lang/attributes'),
	is = require('common/lang/is');

const Attribute = require('./../../definitions/Attribute'),
	Serializers = require('./../Serializers');

const Writer = require('./Writer');

module.exports = (() => {
	'use strict';

	class AttributeSerializationWriter extends Writer {
		constructor(attribute) {
			super();

			assert.argumentIsRequired(attribute, 'attribute', Attribute, 'Attribute');

			this._attribute = attribute;
			this._serializer = Serializers.forAttribute(attribute);

			let readDelegate;
			let existsDelegate;

			if (this._attribute.name.includes(Writer.SEPARATOR)) {
				const names = this._attribute.split(Writer.SEPARATOR);

				readDelegate = source => attributes.read(source, names);
				existsDelegate = source => attribute.has(source, names);
			} else {
				readDelegate = source => target[name];
				existsDelegate = source => source.hasOwnProperty(name);
			}

			this._readDelegate = readDelegate;
			this._existsDelegate = existsDelegate;
		}

		_write(source, target) {
			const name = this._attribute.name;

			target[name] = this._serializer.serialize(this._readDelegate(source));
		}

		_canWrite(source, target) {
			return this._serializer !== null && is.object(source) && this._existsDelegate(this._attribute.name);
		}

		toString() {
			return '[AttributeSerializationWriter]';
		}
	}

	return AttributeSerializationWriter;
})();