const spawn = require('child_process').spawn
const http = require('http')
const fse = require('fs-extra')
const path = require('path')
const tmp = require('tmp')
const os = require('os')

let appPort = process.argv[2]
let timeout = process.argv[3]
let verbose = { verbose: process.argv[4] === 'true' }
let timeoutHolder

const logger = require('./../tools/logger')(verbose)

function startTimeout () {
  logger.verbose(`About to set timeout fx in lib/scripts/autoKillValidator line 17 with timeout value ${timeout}`)
  timeoutHolder = setTimeout(() => {
    // options to pass into the http GET request
    let options = {
      url: 'http://localhost',
      method: 'GET',
      port: appPort,
      path: '/sfesfsefisoeo',
      headers: {
        'User-Agent': 'request'
      }
    }
    // after the timeout period, send a http request
    http.get(options, function (res) {
      logger.verbose(`in autoKillValidator line 30, received response from http://localhost`)
      res.setEncoding('utf8')

      res.on('data', (data) => {
        logger.verbose(`in autoKillValidator line 33, data received from get call to check app activity is ${data}`)
      })

      // if we get any sort of response, then that means the app is still active and that the timer should reset
      res.on('end', () => {
        logger.verbose('app is still active, resetting timer')
        clearTimeout(timeoutHolder)
        startTimeout()
      })

    // if we get an error, likely that the connection is closed and is safe to try to close the validator
    }).on('error', (err) => {
      logger.verbose(`in autoKillValidator line 46, received error from get request for validator (port 48888): ${err.message}`)
      logger.verbose('cannot connect to app, killing the validator now')
      const killLine = spawn('node', [path.join(`${__dirname}/killValidator.js`)], { stdio: 'pipe', shell: false, windowsHide: true })

      killLine.stdout.on('data', (data) => {
        logger.verbose(`autoKillValidator killValidator (killline) stdout: ${data}`)
      })

      killLine.stderr.on('data', (data) => {
        logger.verbose(`autoKillValidator line 55 killValidator (killline) stderr: ${data}`)
      })

      killLine.on('error', (err) => {
        logger.verbose(`autoKillValidator line 59 killValidator (killline) received error:`)
        if (typeof err === 'object') {
          Object.keys(err).forEach(key => {
            logger.verbose(`${key}: ${err[key]}`)
          })
        } else {
          logger.verbose(`${err}`)
        }
      })

      killLine.on('disconnect', (code, signal) => {
        logger.verbose(`autoKillValidator line 70 killValidator (killline) received disconnect with code ${code} and signal ${signal}`)
      })

      killLine.on('message', (msg) => {
        logger.verbose(`autoKillValidator line 74 killValidator (killline) received message: ${msg}`)
      })

      killLine.on('close', (code, signal) => {
        logger.verbose(`autoKillValidator line 78 killValidator (killline) received close with code ${code} and signal ${signal}`)
      })

      killLine.on('exit', (code, signal) => {
        logger.verbose(`autoKillValidator line 82 killValidator (killine) received exit with code ${code} and signal ${signal}`)
        logger.verbose('autoKillValidator line 83 calling process.exit()')
        process.exit()
      })
    })
  }, timeout)
}

let tempObj = tmp.fileSync({ keep: true, name: 'roosevelt_validator_pid.txt' })
fse.writeFileSync(tempObj.name, process.pid)
logger.verbose(`in lib/scripts/autoKillValidator line 59, temp file with PID written to ${tmp.tmpDir}/${tempObj.name}`)
logger.verbose(`Starting the auto Validator Killer, going to kill the validator in ${timeout / 1000} seconds if the app is not in use anymore`)

startTimeout()

process.on('message', (msg) => {
  logger.verbose(`in autoKillValidator received message from process; ${msg}`)
})

process.on('exit', () => {
  let filePath = path.join(os.tmpdir(), 'roosevelt_validator_pid.txt')
  fse.unlinkSync(filePath)
  logger.verbose('Exiting auto Killer')
})
