const { writeFileSync } = require('fs')
const { execSync } = require('child_process')
const { join } = require('path')

const LOG_FILE = join(__dirname, '/logs.json')
const LOG_SCRIPT = join(__dirname, '/pm2-reporter')

class CypressReporterPm2 {
    metricsRepository = {}

    /**
    * custom function for building metric key
    * @param  {object} on [cypress emitter]
    * @param  {string} namespace [namespace]
    * @param  {object} options [reporter options]
    */
    constructor (on, namespace = 'cypressPm2Logs', options = {}) {
        if (!on) {
            throw new Error('Missing required option: on')
        }

        this.on = on
        this.namespace = namespace
        this.options = options
        this.setListeners()
    }

    setListeners () {
        this.on('after:spec', (spec, results) => {
            this.onAfterSpec(results)
        })
        this.on('after:run', (results) => {
            this.onAfterRun(results)
        })
    }

    onAfterSpec (results) {
        results.tests.forEach((test) => {
            const metricName = this._buildMetricTestName(results.spec.name ,test)
            const metric = this._buildMetric(metricName, test.state)
            this.metricsRepository[metricName] = test.state

            this.createMetric(metric)
        })

        const specName = results.spec.name.replace('.spec.js', '')
        this.createTotalMetric(`${specName}.totalDuration`, results.stats.wallClockDuration)
        this.createTotalMetric(`${specName}.totalSuites`, results.stats.suites)
        this.createTotalMetric(`${specName}.totalTests`, results.stats.tests)
        this.createTotalMetric(`${specName}.totalFailed`, results.stats.failures)
        this.createTotalMetric(`${specName}.totalPassed`, results.stats.passes)
        this.createTotalMetric(`${specName}.totalPending`, results.stats.pending)
        this.createTotalMetric(`${specName}.totalSkipped`, results.stats.skipped)
    }

    onAfterRun (result) {
        this.createTotalMetric('totalDuration', result.totalDuration)
        this.createTotalMetric('totalSuites', result.totalSuites)
        this.createTotalMetric('totalTests', result.totalTests)
        this.createTotalMetric('totalFailed', result.totalFailed)
        this.createTotalMetric('totalPassed', result.totalPassed)
        this.createTotalMetric('totalPending', result.totalPending)
        this.createTotalMetric('totalSkipped', result.totalSkipped)

        console.log('MetricsRepository', this.metricsRepository)
    }

    createTotalMetric(name, value) {
        const totalMetricName = this._buildMetricName(name)
        this.metricsRepository[totalMetricName] = value
        const totalMetric = this._buildMetric(totalMetricName, value)
        this.createMetric(totalMetric)
    }

    createMetric (metric) {
        writeFileSync(LOG_FILE, metric)
        execSync(`node ${LOG_SCRIPT}`)
    }

    _buildMetric (metricName, value) {
        return JSON.stringify({
            [metricName]: value
        })
    }

    _buildMetricTestName (spec, test) {
        if (this.options.metricNameBuilder && typeof this.options.metricNameBuilder === 'function') {
            return this.options.metricNameBuilder(spec, test, this.namespace)
        }

        const parsedTestName = this._parseTestName(spec, test)
        return this._buildMetricName(parsedTestName)
    }

    _buildMetricName (name) {
        const namePrefix = this.options.namePrefix
        const nameSuffix = this.options.nameSuffix

        if (namePrefix && typeof namePrefix === 'string') {
            name = `${namePrefix}.${name}`
        }
        if (nameSuffix && typeof nameSuffix === 'string') {
            name = `${name}.${nameSuffix}`
        }

        return `${this.namespace}.${name}`
    }

    _parseTestName (spec, test) {
        if (this.options.testNameParser && typeof this.options.testNameParser === 'function') {
            return this.options.testNameParser(spec, test)
        }

        const specName = spec.replace('.spec.js', '')
        const testPath = [specName, ...test.title]
        return testPath.map(title => title.split(' ').map(el => el.toLowerCase()).join('_')).join('.')
    }
}

module.exports = CypressReporterPm2
