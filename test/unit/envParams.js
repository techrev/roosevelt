/* eslint-env mocha */

const assert = require('assert')
const path = require('path')
const roosevelt = require('../../roosevelt')

describe('ENV Parameter Tests', function () {
  const appConfig = {
    appDir: path.join(__dirname, '../app/envParams'),
    enableCLIFlags: false,
    logging: {
      http: false,
      appStatus: false,
      warnings: false
    },
    https: {
      httpsPort: 12345
    }
  }
  let app

  it('should change the enable param to true', function (done) {
    const temp = process.env.ROOSEVELT_VALIDATOR
    process.env.ROOSEVELT_VALIDATOR = 'detached'
    app = roosevelt({
      ...appConfig
    })
    assert.strictEqual(app.expressApp.get('params').htmlValidator.separateProcess.enable, true)
    process.env.ROOSEVELT_VALIDATOR = temp
    done()
  })

  it('should change the enable param to false', function (done) {
    const temp = process.env.ROOSEVELT_VALIDATOR
    process.env.ROOSEVELT_VALIDATOR = 'attached'
    app = roosevelt({
      ...appConfig
    })
    assert.strictEqual(app.expressApp.get('params').htmlValidator.separateProcess.enable, false)
    process.env.ROOSEVELT_VALIDATOR = temp
    done()
  })

  it('should change the https.httpsPort param to 45678', function (done) {
    const temp = process.env.HTTPS_PORT
    process.env.HTTPS_PORT = 45678
    app = roosevelt({
      ...appConfig
    })
    assert.strictEqual(app.expressApp.get('params').https.httpsPort, '45678')
    process.env.HTTPS_PORT = temp
    done()
  })
})
