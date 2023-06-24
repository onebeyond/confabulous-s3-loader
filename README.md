# ⚠️ This repository is not longer maintained ⚠️

This project is not longer maintained and has been archived. More details in [One Beyond Governance Tiers](https://onebeyond-maintainers.netlify.app/governance/tiers)

# Confabulous S3 Loader
Confabulous-S3-Loader is an S3 Loader for [Confabulous](https://github.com/guidesmiths/confabulous) - a hierarchical, asynchronous config loader and post processor.

## TL;DR
```
const confabulous = require('confabulous')
const Confabulous = confabulous.Confabulous
const s3Loader = require('confabulous-s3-loader')
const processors = confabulous.processors

new Confabulous()
    .add((config) => s3Loader({ bucket: config.bucket, key: config.key, mandatory: false, watch: { interval: '5m' } }))
    .on('loaded', (config) => console.log('Loaded', JSON.stringify(config, null, 2)))
    .on('reloaded', (config) => console.log('Reloaded', JSON.stringify(config, null, 2)))
    .on('error', (err) => console.error('Error', err))
    .on('reload_error', (err) => console.error('Reload Error', err))
    .end()
```

### Options
|  Option  |  Type  |  Default  |  Notes  |
|----------|--------|-----------|---------|
| mandatory | boolean | true       | Causes an error/reload_error to be emitted if the configuration does not exist |
| watch     | object  |            | Watching is implemented by issuing HEAD requests and comparing the Etag and Last-Modified headers. You need to specify and interval in the configuration, e.g. ```{ watch: { interval: '5m' } }``` |



