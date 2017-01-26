var aws = require('aws-sdk');
var log4js = require('log4js');

var assert = require('common/lang/assert');
var Disposable = require('common/lang/Disposable');
var is = require('common/lang/is');

module.exports = (() => {
	'use strict';

	const logger = log4js.getLogger('common-node/messaging/S3Provider');

	const mimeTypes = {
		text: 'text/plain',
		html: 'text/html',
		json: 'application/json'
	};
	
	const encodingTypes = {
		utf8: 'utf-8'
	};

	/**
	 * Wrapper for Amazon's S3 SDK.
	 *
	 * @public
	 * @extends Disposable
	 * @param {object} configuration
	 * @param {string} configuration.region
	 * @param {string=} configuration.apiVersion
	 */
	class S3Provider extends Disposable {
		constructor(configuration) {
			super();

			assert.argumentIsRequired(configuration, 'configuration');
			assert.argumentIsRequired(configuration.region, 'configuration.region', String);
			assert.argumentIsOptional(configuration.apiVersion, 'configuration.apiVersion', String);

			this._s3 = null;

			this._configuration = configuration;

			this._startPromise = null;
			this._started = false;
		}

		/**
		 * Connects to Amazon. Must be called once before using other instance
		 * functions.
		 *
		 * @returns {Promise.<boolean>}
		 */
		start() {
			if (this.getIsDisposed()) {
				throw new Error('The S3 Provider has been disposed.');
			}

			if (this._startPromise === null) {
				this._startPromise = Promise.resolve()
					.then(() => {
						aws.config.update({region: this._configuration.region});

						this._s3 = new aws.S3({apiVersion: this._configuration.apiVersion || '2006-03-01'});
					}).then(() => {
						logger.info('S3 provider started');

						this._started = true;

						return this._started;
					}).catch((e) => {
						logger.error('S3 provider failed to start', e);

						throw e;
					});
			}

			return this._startPromise;
		}

		/**
		 * Retrieves the contents of a bucket.
		 *
		 * @param {string} bucket
		 *
		 * @returns {Promise.<object>}
		 */
		getBucketContents(bucket) {
			if (this.getIsDisposed()) {
				throw new Error('The S3 Provider has been disposed.');
			}

			if (!this._started) {
				throw new Error('The S3 Provider has not been started.');
			}

			return new Promise((resolveCallback, rejectCallback) => {
				this._s3.listObjects({Bucket: bucket}, (err, data) => {
					if (err) {
						logger.error('S3 failed to retrieve contents: ', err);
						rejectCallback(err);
					} else {
						resolveCallback({
							content: data.Contents
						});
					}
				});
			});
		}

		/**
		 * Uploads an object to a bucket.
		 *
		 * @param {string} bucket
		 * @param {string} filename
		 * @param {string|Buffer} buffer - The content to upload
		 * @param {string=} mimeType = Defaults to "text/plain"
		 * @param {boolean=} secure = Indicates if the "private" ACL applies to the object
		 *
		 * @returns {Promise.<object>}
		 */
		uploadObject(bucket, filename, content, mimeType, secure) {
			if (this.getIsDisposed()) {
				throw new Error('The S3 Provider has been disposed.');
			}

			if (!this._started) {
				throw new Error('The S3 Provider has not been started.');
			}

			return new Promise((resolveCallback, rejectCallback) => {
				let acl;

				if (is.boolean(secure) && secure) {
					acl = 'private';
				} else {
					acl = 'public-read';
				}

				let mimeTypeToUse;

				if (is.string(mimeType)) {
					mimeTypeToUse = mimeType;
				} else if (is.string(content)) {
					mimeTypeToUse = mimeTypes.text;
				} else if (is.object) {
					mimeTypeToUse = mimeTypes.json;
				} else {
					throw new Error('Unable to automatically determine MIME type for file.');
				}

				const params = {
					Bucket: bucket,
					Key: filename,
					ACL: acl,
					Body: ContentHandler.getHandlerFor(mimeTypeToUse).toBuffer(content),
					ContentType: mimeTypeToUse
				};

				const options = {
					partSize: 10 * 1024 * 1024,
					queueSize: 1
				};

				this._s3.upload(params, options, (err, data) => {
					if (err) {
						logger.error('S3 failed to upload object: ', err);
						rejectCallback(err);
					} else {
						resolveCallback({data: data});
					}
				});
			});
		}

		/**
		 * Downloads an object from a bucket
		 *
		 * @param {string} bucket
		 * @param {string} filename
		 *
		 * @returns {Promise.<object>}
		 */
		downloadObject(bucket, filename) {
			if (this.getIsDisposed()) {
				throw new Error('The S3 Provider has been disposed.');
			}

			if (!this._started) {
				throw new Error('The S3 Provider has not been started.');
			}

			return new Promise((resolveCallback, rejectCallback) => {
				this._s3.getObject({ Bucket: bucket, Key: filename }, (err, data) => {
					if (err) {
						logger.error('S3 failed to upload object: ', err);
						rejectCallback(err);
					} else {
						resolveCallback(ContentHandler.getHandlerFor(data.ContentType).fromBuffer(data.Body));
					}
				});
			});
		}

		/**
		 * Deletes an object from a bucket.
		 *
		 * @param {string} bucket
		 * @param {string} filename
		 *
		 * @returns {Promise.<object>}
		 */
		deleteObject(bucket, filename) {
			if (this.getIsDisposed()) {
				throw new Error('The S3 Provider has been disposed.');
			}

			if (!this._started) {
				throw new Error('The S3 Provider has not been started.');
			}

			return new Promise((resolveCallback, rejectCallback) => {
				const params = {
					Bucket: bucket,
					Key: filename
				};

				this._s3.deleteObject(params, (err, data) => {
					if (err) {
						logger.error('S3 failed to delete object: ', err);
						rejectCallback(err);
					} else {
						resolveCallback({data: data});
					}
				});
			});
		}

		_onDispose() {
			logger.debug('S3 provider disposed');
		}

		toString() {
			return '[S3Provider]';
		}
	}

	const contentHandlers = [ ];

	class ContentHandler {
		constructor() {

		}

		canProcess(mimeType) {
			return true;
		}

		toBuffer(content) {
			return Buffer.from(content);
		}

		fromBuffer(buffer) {
			return buffer;
		}

		static getHandlerFor(mimeType) {
			if (contentHandlers.length === 0) {
				contentHandlers.push(new JsonContentHandler());
				contentHandlers.push(new TextContentHandler());
				contentHandlers.push(new DefaultContentHandler());
			}

			return contentHandlers.find(handler => handler.canProcess(mimeType));
		}
	}

	class TextContentHandler extends ContentHandler {
		constructor() {
			super();
		}

		canProcess(mimeType) {
			return mimeType.startsWith('text');
		}

		toBuffer(content) {
			if (is.string(content)) {
				return Buffer.from(content, encodingTypes.utf8);
			} else {
				return Buffer.from(content);
			}
		}

		fromBuffer(buffer) {
			return buffer.toString(encodingTypes.utf8);
		}
	}

	class JsonContentHandler extends TextContentHandler {
		constructor() {
			super();
		}

		canProcess(mimeType) {
			return mimeType === mimeTypes.json;
		}

		toBuffer(content) {
			if (is.object(content)) {
				return super.toBuffer(JSON.stringify(content));
			} else {
				return super.toBuffer(content);
			}
		}

		fromBuffer(buffer) {
			return JSON.parse(super.fromBuffer(buffer));
		}
	}

	class DefaultContentHandler extends ContentHandler {
		constructor() {
			super();
		}
	}

	return S3Provider;
})();