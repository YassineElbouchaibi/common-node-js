var StringSerializer = require('./../../../../../../../aws/dynamo/schema/serialization/attributes/StringSerializer');

describe('When a String Serializer is instantiated', function() {
	'use strict';

	var serializer;

	beforeEach(function() {
		serializer = new StringSerializer();
	});

	it('it serializes "three" as { "N": "three" }', function() {
		var serialized = serializer.serialize("three");

		expect(serialized.S).toEqual('three');
	});

	it('it deserializes { "N": "three" } as "three"', function() {
		var deserialized = serializer.deserialize({ S: 'three' });

		expect(deserialized).toEqual('three');
	});
});