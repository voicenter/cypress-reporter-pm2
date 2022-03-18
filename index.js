const CypressReporterPm2 = require('./cypress-reporter-pm2')

module.exports = function (emitter, namespace = 'cypressPm2Logs', options = {}) {
    console.log(`Started cypress-reporter-pm2 for ${namespace}`)
    new CypressReporterPm2(...arguments)
}