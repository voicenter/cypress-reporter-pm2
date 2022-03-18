const { readFileSync } = require('fs')
const { join } = require('path')
const io = require('@pm2/io')

const LOG_FILE = join(__dirname, '/logs.json')

try {
    const log = JSON.parse(readFileSync(LOG_FILE))
    const [key, value] = Object.entries(log)[0]

    const metric = io.metric({
        name: key,
    })

    metric.set(value)
} catch (e) {
    console.error(e)
}
