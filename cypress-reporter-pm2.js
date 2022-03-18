const { writeFileSync } = require('fs')
const { execSync } = require('child_process')
const { join } = require('path')

const LOG_FILE = join(__dirname, '/logs.json')
const LOG_SCRIPT = join(__dirname, '/pm2-reporter')

class CypressReporterPm2 {
    metricsRepository = {}

    /*
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
            const metricName = this._buildMetricTestName(test)
            const metric = this._buildMetric(metricName, test.state)
            this.metricsRepository[metricName] = test.state

            this.createMetric(metric)
        })
    }

    onAfterRun (result) {
        const totalDurationMetricName = this._buildMetricName('totalDuration')
        const totalSuitesMetricName = this._buildMetricName('totalSuites')
        const totalTestsMetricName = this._buildMetricName('totalTests')
        const totalFailedMetricName = this._buildMetricName('totalFailed')
        const totalPassedMetricName = this._buildMetricName('totalPassed')
        const totalPendingMetricName = this._buildMetricName('totalPending')
        const totalSkippedMetricName = this._buildMetricName('totalSkipped')

        this.metricsRepository[totalDurationMetricName] = result.totalDuration
        this.metricsRepository[totalSuitesMetricName] = result.totalSuites
        this.metricsRepository[totalTestsMetricName] = result.totalTests
        this.metricsRepository[totalFailedMetricName] = result.totalFailed
        this.metricsRepository[totalPassedMetricName] = result.totalPassed
        this.metricsRepository[totalPendingMetricName] = result.totalPending
        this.metricsRepository[totalSkippedMetricName] = result.totalSkipped

        const totalDurationMetric = this._buildMetric(totalDurationMetricName, result.totalDuration)
        const totalSuitesMetric = this._buildMetric(totalSuitesMetricName, result.totalSuites)
        const totalTestsMetric = this._buildMetric(totalTestsMetricName, result.totalTests)
        const totalFailedMetric = this._buildMetric(totalFailedMetricName, result.totalFailed)
        const totalPassedMetric = this._buildMetric(totalPassedMetricName, result.totalPassed)
        const totalPendingMetric = this._buildMetric(totalPendingMetricName, result.totalPending)
        const totalSkippedMetric = this._buildMetric(totalSkippedMetricName, result.totalSkipped)

        this.createMetric(totalDurationMetric)
        this.createMetric(totalSuitesMetric)
        this.createMetric(totalTestsMetric)
        this.createMetric(totalFailedMetric)
        this.createMetric(totalPassedMetric)
        this.createMetric(totalPendingMetric)
        this.createMetric(totalSkippedMetric)

        console.log('MetricsRepository', this.metricsRepository)
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

    _buildMetricTestName (test) {
        if (this.options.metricNameBuilder && typeof this.options.metricNameBuilder === 'function') {
            return this.options.metricNameBuilder(test, this.namespace)
        }

        const parsedTestName = this._parseTestName(test)
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

    _parseTestName (test) {
        if (this.options.testNameParser && typeof this.options.testNameParser === 'function') {
            return this.options.testNameParser(test)
        }

        return test.title.map(title => title.split(' ').map(el => el.toLowerCase()).join('_')).join('.')
    }
}

module.exports = CypressReporterPm2
