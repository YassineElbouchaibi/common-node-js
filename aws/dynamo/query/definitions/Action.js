const assert = require('common/lang/assert');

const Filter = require('./Filter'),
	Serializers = require('./../../schema/serialization/Serializers');

module.exports = (() => {
	'use strict';

	/**
	 * The base class for a object which defines some sort of conditional
	 * operation that targets a {@link Table}.
	 *
	 * @public
	 * @interface
	 * @param {Table} table
	 * @param {Index=} index
	 * @param {String=} description
	 */
	class Action {
		constructor(table, index, description) {
			this._table = table;
			this._index = index || null;
			this._description = description;
		}

		/**
		 * A {@link Table} to target.
		 *
		 * @public
		 * @returns {Table}
		 */
		get table() {
			return this._table;
		}

		/**
		 * An {@Index} of the table to target (optional).
		 *
		 * @public
		 * @returns {Index|null}
		 */
		get index() {
			return this._index;
		}

		/**
		 * A description of the scan (for logging purposes).
		 *
		 * @public
		 * @returns {String}
		 */
		get description() {
			return this._description;
		}

		/**
		 * Used to convert {@link Filter} definitions into data suitable for
		 * passing to the AWS SDK. This function is for internal use only.
		 *
		 * @protected
		 * @param {Filter} filter
		 * @param {Number} offset
		 * @returns {Object}
		 */
		static getExpressionData(filter, offset) {
			assert.argumentIsRequired(filter, 'filter', Filter, 'Filter');
			assert.argumentIsOptional(offset, 'offset', Number);

			const offsetToUse = offset || 0;

			return filter.expressions.reduce((accumulator, e, index) => {
				const operatorType = e.operatorType;
				const operand = e.operand;

				const indexToUse = index + offsetToUse;

				const repeatCount = 1 + Math.floor(indexToUse / 26);
				const letterCode = 97 + (indexToUse % 26);

				const addOperandAlias = (operandAlias, operandValue) => {
					accumulator.aliases[operandAlias] = operandValue;
				};

				let operandAliases;

				if (operatorType.operandCount > 1) {
					operandAliases = operand.map((o, i) => {
						const operandAlias = `:${String.fromCharCode(letterCode).repeat(repeatCount)}${i}`;
						const operandValue = Serializers.forDataType(e.attribute.dataType).serialize(operand[i]);

						addOperandAlias(operandAlias, operandValue);

						return operandAlias;
					});
				} else if (operatorType.operandCount === 1) {
					const operandAlias = `:${String.fromCharCode(letterCode).repeat(repeatCount)}`;
					const operandValue = Serializers.forDataType(e.attribute.dataType).serialize(operand);

					addOperandAlias(operandAlias, operandValue);

					operandAliases = operandAlias;
				} else {
					operandAliases = [ ];
				}

				accumulator.components.push(operatorType.format(e.attribute.name, operandAliases));

				return accumulator;
			}, { components: [ ], aliases: { }, offset: offsetToUse + filter.expressions.length });
		}

		static getProjectionData(attributes) {
			const items = attributes.map((a, index) => {
				const repeatCount = 1 + Math.floor(index / 26);
				const letterCode = 97 + (index % 26);

				const alias = `#${String.fromCharCode(letterCode).repeat(repeatCount)}`;

				return {
					name: a.name,
					alias: alias,
				};
			});

			const aliases = items.reduce((accumulator, item) => {
				accumulator[item.alias] = item.name;

				return accumulator;
			}, { });

			const projection = items.map(item => item.alias).join(',');

			return {
				aliases: aliases,
				projection: projection
			};
		}

		toString() {
			return '[Action]';
		}
	}

	return Action;
})();