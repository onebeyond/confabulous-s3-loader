var debug = require('debug')('confabulous:loaders:s3')
var EventEmitter = require('events').EventEmitter
var AWS = require('aws-sdk')
var s3 = new AWS.S3({signatureVersion: 'v4'})
var async = require('async')
var duration = require('parse-duration')
var merge = require('lodash.merge')
var contains = require('lodash.contains')
var format = require('util').format

module.exports = function(_options, postProcessors) {

    var options = merge({}, { mandatory: true, watch: false, s3: {} }, _options)
    var exists = false
    var headers = {}
    var allowedResponseCodes = [].concat(options.mandatory ? [] : [403, 404])
    var emitter = new EventEmitter()

    return function(confabulous, cb) {
        debug('running')
        setImmediate(function() {
            async.waterfall([validate, watch, load], function(err, result) {
                if (err) return cb(err)
                async.seq.apply(async, postProcessors)(result, cb)
            })
        })
        return emitter

        function validate(cb) {
            debug('validate: %s', JSON.stringify(options))
            if (options.mandatory && !options.bucket) return cb(new Error('bucket is required'))
            if (options.mandatory && !options.key) return cb(new Error('key is required'))
            cb(!(options.bucket && options.key))
        }

        function watch(cb) {
            debug('watch: %s/%s, interval:%s', options.bucket, options.key, options.watch.interval)
            if (!options.watch) return cb()
            var watcher = setInterval(function() {
                debug('checking for changes to: %s/%s', options.bucket, options.key)
                head({ IfNoneMatch: headers['ETag'] }, function(err, data) {
                    if (!watcher) return
                    if (err && !contains(allowedResponseCodes.concat(304), err.statusCode)) return emitter.emit('error', new Error(format('%s/%s returned %d', options.bucket, options.key, err.statusCode)))
                    if (err && err.statusCode === 304) return
                    console.log(err && err.statusCode, data)
                    if (err && err.statusCode === 403 && exists || err && err.statusCode === 404 && exists || data && (!exists || isModified(data))) emitter.emit('change')
                })
            }, duration(options.watch.interval))
            watcher.unref()
            confabulous.on('reloading', function() {
                clearInterval(watcher)
                watcher = null
            })
            return cb()
        }

        function load(cb) {
            debug('load: %s/%s', options.bucket, options.key)
            exists = false
            get(function(err, data) {
                if (err && !contains(allowedResponseCodes, err.statusCode)) return cb(new Error(format('%s/%s returned %d', options.bucket, options.key, err.statusCode)))
                if (err) return cb(true)
                headers.ETag = data.ETag
                exists = true
                cb(err, JSON.parse(data.Body))
            })
        }

        function head(args, cb) {
            if (arguments.length === 1) return head({}, arguments[0])
            s3.headObject(merge({ Bucket: options.bucket, Key: options.key }, options.s3, args), cb)
        }

        function get(args, cb) {
            if (arguments.length === 1) return get({}, arguments[0])
            s3.getObject(merge({ Bucket: options.bucket, Key: options.key }, options.s3, args), cb)
        }

        function isModified(data) {
            return data.ETag !== headers.ETag
        }
    }
}
