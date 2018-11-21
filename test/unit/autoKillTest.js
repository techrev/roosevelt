/* eslint-env mocha */

const assert = require('assert')
const cleanupTestApp = require('../util/cleanupTestApp')
const fkill = require('fkill')
const fork = require('child_process').fork
const fse = require('fs-extra')
const generateTestApp = require('../util/generateTestApp')
const http = require('http')
const os = require('os')
const path = require('path')

describe('Roosevelt Autokill Test', function () {
  // directory for the test app
  const appDir = path.join(__dirname, '../app/htmlValidatorTest')

  // options to pass into test app generator
  const options = { rooseveltPath: '../../../roosevelt', method: 'startServer', stopServer: true }

  // clean up the test app directory after each test
  afterEach(function (done) {
    cleanupTestApp(appDir, (err) => {
      if (err) {
        throw err
      } else {
        done()
      }
    })
  })

  it.skip('should kill the validator after the app has gracefully shutdown if the validator is a separate process', function (done) {
    let cannotConnectBool = false
    let htmlValidatorPortClosedBool = false
    let autoKillerStartedBool = false

    // generate the test app
    generateTestApp({
      appDir: appDir,
      logging: {
        verbose: true
      },
      generateFolderStructure: true,
      htmlValidator: {
        enable: true,
        port: 48888,
        separateProcess: {
          enable: true,
          autoKillerTimeout: 1000
        }
      },
      onServerStart: `(app) => {process.send(app.get("params"))}`
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), ['--dev'], { 'stdio': ['pipe', 'pipe', 'pipe', 'ipc'] })

    // on the output stream, check for specific logs
    testApp.stdout.on('data', (data) => {
      if (data.includes('Killed process with PID')) {
        htmlValidatorPortClosedBool = true
        exit()
      } else if (data.includes('Spawning a process to automatically kill the detached validator')) {
        autoKillerStartedBool = true
      } else if (data.includes('cannot connect to app, killing the validator now')) {
        cannotConnectBool = true
      }
    })

    // when the app finishes initiailization, kill it
    testApp.on('message', (msg) => {
      testApp.send('stop')
    })

    // when the autokiller has confirmed it has killed the process, check assertions and finish this test
    function exit () {
      assert.strictEqual(htmlValidatorPortClosedBool, true, 'The auto Killer did not kill the html Validator after the app was closed')
      assert.strictEqual(autoKillerStartedBool, true, 'Roosevelt did not start the autoKiller')
      assert.strictEqual(cannotConnectBool, true, 'The auto Killer somehow kept on connecting with the app even thought it closed alreadly')
      done()
    }
  })

  it.skip('should restart the autokill timer if the app is still active, then once the app has gracefully shutdown it should kill the validator.', function (done) {
    let timerResetBool = false
    let htmlValidatorPortClosedBool = false
    let autoKillerStartedBool = false
    let cannotConnectBool = false

    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      logging: {
        verbose: true
      },
      htmlValidator: {
        enable: true,
        port: 48888,
        separateProcess: {
          enable: true,
          autoKillerTimeout: 10000
        }
      },
      onServerStart: `(app) => {process.send(app.get("params"))}`
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), ['--dev'], { 'stdio': ['pipe', 'pipe', 'pipe', 'ipc'] })

    // on the output stream, check for specific logs
    testApp.stdout.on('data', (data) => {
      if (data.includes('Spawning a process to automatically kill the detached validator')) {
        autoKillerStartedBool = true
      }
      // on this specific log, kill the app
      if (data.includes('app is still active, resetting timer')) {
        timerResetBool = true
        testApp.send('stop')
      } else if (data.includes('cannot connect to app, killing the validator now')) {
        cannotConnectBool = true
      } else if (data.includes('Killed process with PID')) {
        htmlValidatorPortClosedBool = true
        exit()
      }
    })

    // when the autokiller has confirmed it has killed the process, check assertions and finish this test
    function exit () {
      assert.strictEqual(autoKillerStartedBool, true, 'Roosevelt did not start the autoKiller')
      assert.strictEqual(timerResetBool, true, 'auto Killer did not reset its timer when it checked if the app was closed while it was still opened')
      assert.strictEqual(cannotConnectBool, true, 'The auto Killer somehow kept on connecting with the app even thought it closed alreadly')
      assert.strictEqual(htmlValidatorPortClosedBool, true, 'The auto Killer did not kill the html Validator after the app was closed')
      done()
    }
  })

  it('should say that it\'s restarting auto Killer if one is running and the app is being initialized again', function (done) {
    let restartAutoKillerLogBool = false
    // let beg = Date.now()
    // let end = Date.now()
    // let timeToRun = end - beg
    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      logging: {
        verbose: true
      },
      htmlValidator: {
        enable: true,
        port: 48888,
        separateProcess: {
          enable: true,
          autoKillerTimeout: 1000
        }
      },
      onServerStart: `(app) => {process.send(app.get("params"))}`
    }, options)

    console.log('Starting an autokiller instance from autoKillTest line 162')
    // fork an autoKiller instance
    const autoKill1 = fork(path.join(__dirname, '../../lib/scripts/autoKillValidator.js'), [48888, 10000, 'true'], { 'stdio': ['pipe', 'pipe', 'pipe', 'ipc'] })

    autoKill1.stdout.on('data', (data) => {
      console.log(`From autokillTest line 165, autokill1 stdout data is ${data}`)
    })

    autoKill1.stderr.on('data', (data) => {
      console.log(`From autokillTest line 169, autokill1 stderr data is ${data}`)
    })

    autoKill1.on('error', (err) => {
      console.log(`in autoKillTest line 173, error received from autokill1: ${err.message}`)
    })

    autoKill1.on('message', (msg) => {
      console.log(`in autoKillTest line 177, message received from autokill1: ${msg}`)
    })

    autoKill1.on('disconnect', (code, signal) => {
      console.log(`in autoKillTest line 181, disconnect received from autokill1, code is ${code} signal is ${signal}`)
    })

    autoKill1.on('close', (code, signal) => {
      console.log(`in autoKillTest line 185, close received from autokill1, code is ${code} signal is ${signal}`)
    })

    autoKill1.on('exit', (code, signal) => {
      console.log(`in autoKillTest line 189, exit received from autokill1, code is ${code} signal is ${signal}`)
    })

    console.log('Starting the app from autoKillTest line 165, which will launch it\'s own autokiller')
    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), ['--dev'], { 'stdio': ['pipe', 'pipe', 'pipe', 'ipc'] })

    // on the output stream, check for specific logs
    testApp.stdout.on('data', (data) => {
      // end = Date.now()
      // timeToRun = end - beg
      // console.log(`${timeToRun / 1000} seconds since test launch`)
      console.log(`From autoKillTest, line 201, testApp stdout data is ${data}`)
      if (data.includes('Respawning a process to automatically kill the detached validator')) {
        restartAutoKillerLogBool = true
      } else if (data.includes('Killed process with PID')) {
        exit()
      }
    })

    testApp.stderr.on('data', (data) => {
      console.log(`From autoKillTest, line 210, testApp stderr data is ${data}`)
    })

    // when the app finishes initialization, kill it
    testApp.on('message', (msg) => {
      // end = Date.now()
      // timeToRun = end - beg ${timeToRun / 1000} seconds since test launch
      console.log(`Received message ${msg.toString()} in testApp, about to kill app. `)
      testApp.send('stop')
    })

    testApp.on('error', (err) => {
      console.log(`From autoKillTest, line 222, testApp received error: ${err.message}`)
    })

    testApp.on('disconnect', (code, signal) => {
      console.log(`From autoKillTest, line 226, testApp received disconnect with code ${code} and signal ${signal}`)
    })

    testApp.on('close', (code, signal) => {
      console.log(`From autoKillTest, line 230, testApp received close with code ${code} and signal ${signal}`)
    })

    testApp.on('exit', (code, signal) => {
      console.log(`From autoKillTest, line 234, testApp received exit with code ${code} and signal ${signal}`)
    })

    // when the autokiller has confirmed it has killed the process, check assertions and finish this test
    function exit () {
      // end = Date.now()
      // timeToRun = end - beg ${timeToRun / 1000} seconds since test launch
      console.log(`in autoKillTest line 241, called exit function to stop test.`)
      assert.strictEqual(restartAutoKillerLogBool, true, 'Roosevelt did not restart the autoKiller')
      done()
    }
  })

  it.skip('should be able to say that there is no autoKiller and that it is starting a new one if the roosevelt_validator_pid.txt file exists, but the process is already dead', function (done) {
    let noAutoKillerFromPIDBool = false

    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      logging: {
        verbose: true
      },
      htmlValidator: {
        enable: true,
        separateProcess: {
          enable: true,
          autoKillerTimeout: 1000
        }
      },
      onServerStart: `(app) => {process.send(app.get("params"))}`
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), ['--dev'], { 'stdio': ['pipe', 'pipe', 'pipe', 'ipc'] })

    // on the output stream, check for specific logs
    testApp.stdout.on('data', data => {
      // kill the app after the auto killer runs
      if (data.includes('Starting the auto Validator Killer')) {
        testApp.send('stop')

        // start a second test app
        startSecondApp()
      }
    })

    function startSecondApp () {
      const PIDFilePath = path.join(os.tmpdir(), 'roosevelt_validator_pid.txt')
      let content = fse.readFileSync(PIDFilePath).toString('utf8')
      let PID = parseInt(content)
      fkill(PID, { force: true }).then(() => {
        // create a second App
        const testApp2 = fork(path.join(appDir, 'app.js'), ['--dev'], { 'stdio': ['pipe', 'pipe', 'pipe', 'ipc'] })

        // check the console logs to see if our message was outputted
        testApp2.stdout.on('data', (data) => {
          if (data.includes('Spawning a process to automatically kill the detached validator')) {
            noAutoKillerFromPIDBool = true
          } else if (data.includes('Exiting auto Killer')) {
            // wait for the auto killer to finish before exiting the test
            exit()
          }
        })

        // when its finish with initialization, kill it
        testApp2.on('message', () => {
          testApp2.send('stop')
        })

        function exit () {
          assert.strictEqual(noAutoKillerFromPIDBool, true, 'The auto Killer was not started after there was no process found with the given PID')
          done()
        }
      })
    }
  })

  it.skip('should log that a validator will be created if one isn\'t running but all other logs are hidden due to verbose logs being set false.', function (done) {
    let timerResetBool = false
    let htmlValidatorPortClosedBool = false
    let autoKillerStartedBool = false
    let cannotConnectBool = false

    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      htmlValidator: {
        enable: true,
        port: 48888,
        separateProcess: {
          enable: true,
          autoKillerTimeout: 1000
        }
      },
      onServerStart: `(app) => {process.send(app.get("params"))}`
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), ['--dev'], { 'stdio': ['pipe', 'pipe', 'pipe', 'ipc'] })

    // on the output stream, check for specific logs
    testApp.stdout.on('data', (data) => {
      if (data.includes('Spawning a process to automatically kill the detached validator')) {
        autoKillerStartedBool = true
      }

      // don't kill the app until a GET request for the autokiller has been requested
      if (data.includes('Roosevelt Express HTTP server listening on port')) {
        setTimeout(() => {
          testApp.send('stop')
        }, 3000)
      } else if (data.includes('app is still active, resetting timer')) {
        timerResetBool = true
      } else if (data.includes('cannot connect to app, killing the validator now')) {
        cannotConnectBool = true
      } else if (data.includes('Killed process with PID')) {
        htmlValidatorPortClosedBool = true
      }
    })

    // on exit, check if the specific logs were outputted and that the validator was closed
    testApp.on('exit', () => {
      setTimeout(() => {
        assert.strictEqual(autoKillerStartedBool, true, 'Roosevelt did not start the autoKiller')
        assert.strictEqual(timerResetBool, false, 'auto Killer did not reset its timer when it checked if the app was closed while it was still opened')
        assert.strictEqual(cannotConnectBool, false, 'The auto Killer somehow kept on connecting with the app even thought it closed alreadly')
        assert.strictEqual(htmlValidatorPortClosedBool, false, 'The auto Killer did not kill the html Validator after the app was closed')
        // options to pass into the http GET request
        let options = {
          url: 'http://localhost',
          method: 'GET',
          port: 42312,
          headers: {
            'User-Agent': 'request'
          }
        }
        // after the timeout period, send a http request
        http.get(options, function (res) {
          const { statusCode } = res
          // if we get any sort of statusCode, whether it be 404, 200 etc, then that means the app is still active and that the timer should reset
          if (statusCode) {
            assert.fail('we got a response from a validator that is supposed to be closed')
            done()
          }
          // if we get an error, likely that the connection is close and is safe to try to close the validator
        }).on('error', () => {
          done()
        })
      }, 10000)
    })
  })
})
