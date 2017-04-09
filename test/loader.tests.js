var assert = require('chai').assert
var s3Loader = require('..')
var express = require('express')
var EventEmitter = require('events').EventEmitter

describe('s3Loader', function() {

    var confabulous

    beforeEach(function() {
        confabulous = new EventEmitter()
    })

    afterEach(function(done) {
        confabulous.emit('reloading')
        confabulous.removeAllListeners()
        done()
    })

    it('should require bucket when mandatory', function(done) {
        s3Loader()(confabulous, function(err, config) {
            assert(err)
            assert.equal(err.message, 'bucket is required')
            done()
        })
    })

    it('should require key when mandatory', function(done) {
        s3Loader({ bucket: 'confabulous-s3-loader-tests' })(confabulous, function(err, config) {
            assert(err)
            assert.equal(err.message, 'key is required')
            done()
        })
    })

    it('should load configuration', function(done) {
        s3Loader({ bucket: 'confabulous-s3-loader-tests', key: 'test.json' })(confabulous, function(err, config) {
            assert.ifError(err)
            assert.equal(config.loaded, 'loaded')
            done()
        })
    })

    it('should report 404s when mandatory', function(done) {
        s3Loader({ bucket: 'confabulous-s3-loader-tests', key: 'missing.json' })(confabulous, function(err, config) {
            assert(err)
            assert.equal(err.message, 'confabulous-s3-loader-tests/missing.json returned 404')
            done()
        })
    })

    it('should ignore 404s when not mandatory', function(done) {
        s3Loader({ bucket: 'confabulous-s3-loader-tests', key: 'missing.json', mandatory: false })(confabulous, function(err, config) {
            assert.equal(err, true)
            done()
        })
    })

    xit('should emit change event when etag changes', function(done) {
        s3Loader({ bucket: 'confabulous-s3-loader-tests', key: 'test.json', watch: { interval: '1s' } })(confabulous, function(err, config) {
            assert.ifError(err)
            assert.equal(config.loaded, 'loaded')
        }).on('change', done)
    })

    xit('should emit change event when a previously existing page starting returning 404', function(done) {
        s3Loader({ bucket: 'confabulous-s3-loader-tests', key: 'test.json', watch: { interval: '1s' } })(confabulous, function(err, config) {
            assert.ifError(err)
            assert.equal(config.loaded, 'loaded')
        }).on('change', done)
    })

    xit('should emit change event when a previously missing page starts returning 200', function(done) {
        s3Loader({ bucket: 'confabulous-s3-loader-tests', key: 'test.json', watch: { interval: '1s' } })(confabulous, function(err, config) {
            assert.equal(err, true)
        }).on('change', done)
    })

    it('should not emit change events for 304s', function(done) {
        s3Loader({ bucket: 'confabulous-s3-loader-tests', key: 'test.json', mandatory: false, watch: { interval: '1s' } })(confabulous, function(err, config) {
            assert.ifError(err)
            assert.equal(config.loaded, 'loaded')
            setTimeout(done, 1500)
        }).on('change', function() {
            assert(false, 'Change event emitted')
        })
    })

    it('should post-process', function(done) {
        s3Loader({ bucket: 'confabulous-s3-loader-tests', key: 'test.json' }, [
            function(config, cb) {
                config.loaded = config.loaded.toUpperCase()
                cb(null, config)
            }
        ])(confabulous, function(err, config) {
            assert.ifError(err)
            assert.equal(config.loaded, 'LOADED')
            done()
        })
    })
})
