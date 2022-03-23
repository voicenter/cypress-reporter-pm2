# cypress-reporter-pm2

cypress-reporter-pm2 is a cypress plugin for creating metrics after cypress tests execution.

## Install

```bash
# npm
npm install cypress-reporter-pm2 --save-dev

# yarn
yarn add cypress-reporter-pm2 --dev
```

## Usage

Import cypress-reporter-pm2 into cypress/plugins/index.js

```javascript
// cypress/plugins/index.js

require('dotenv').config()
const cypressReporterPm2 = require('cypress-reporter-pm2');

module.exports = (on, config) => {
    config.testFiles = [...JSON.parse(process.env.SPEC_TO_RUN)]
    cypressReporterPm2(on)

    return config
};

```

Create pm2 config file in the project root directory:

```javascript
// test.config.js
require('dotenv').config()

module.exports = {
    apps: [{
        name: 'cypress-basic-test',
        script: './node_modules/@vue/cli-service/bin/vue-cli-service.js',
        watch: false,
        args: `test:e2e --url=${process.env.VUE_APP_URL} --headless`,
        cwd: './',
        restart_delay: 180000,
        env: {
            SPEC_TO_RUN: '["page.exist.spec.js", "check.name.spec.js"]'
        }
    }]
}

```

`env.SPEC_TO_RUN` should include stringified array of tests which should be executed.

Set `VUE_APP_URL` to `.env` or use hardcoded string instead.

Use `restart_delay` to set the interval time between tests execution (in milliseconds).

Execute:
```bash
pm2 start test.config.js
```

## Parameters
* *on* - cypress event emitter
* *namespace [string]* - namespace for current application to differ it's metrics from other applications
* *options [object]* - configuration for plugin.

  - namePrefix [string] - prefix for customizing metric key
  - nameSuffix [string] - suffix for customizing metric key
  - metricNameBuilder [function] - custom function for building metric key.<br/>
    @param {string} spec [spec name] <br/>
  - @param {object} test [test data] <br/>
    @param {string} namespace [namespace] <br/>
    @return {string}
  - testNameParser [function] - custom function for parsing test name.<br/>
    @param {string} spec [spec name] <br/>
  - @param {object} test [test data] <br/>
    @return {string}
