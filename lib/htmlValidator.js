// html validator

require('colors')

const validator = require('html-validator')
const tamper = require('tamper')
const spawn = require('child_process').spawn
const vnu = require('vnu-jar')
const http = require('http')
const fs = require('fs')
const path = require('path')
const template = require('es6-template-strings')
const validatorErrorPage = fs.readFileSync(path.join(__dirname, '../defaultErrorPages/views/htmlValidator.html'))
const os = require('os')
const fkill = require('fkill')
const Prism = require('prismjs')
const prismPath = require.resolve('prismjs')
const prismStyleSheet = fs.readFileSync(path.join(prismPath.split('prism.js')[0], 'themes/prism.css'))

module.exports = function (app, callback) {
  const logger = require('./tools/logger')(app.get('params').logging)
  let params = app.get('params')
  let validatorProcess
  let javaDetectProcess
  let headerException = params.htmlValidator.exceptions.requestHeader
  let modelException = params.htmlValidator.exceptions.modelValue
  let i
  let validatorTimeout
  let validatorOptions = {
    url: 'http://localhost',
    method: 'GET',
    headers: {
      'User-Agent': 'request'
    }
  }

  if (params.htmlValidator.enable) {
    validatorOptions.port = params.htmlValidator.port
    callValidator()
  } else {
    if (app.get('env') !== 'production') {
      logger.warn('HTML validator disabled. Continuing without HTML validation...'.yellow)
    }
    callback()
  }

  function callValidator () {
    return new Promise((resolve, reject) => {
      // see if there's one already running
      http.get(validatorOptions, (res) => {
        const { statusCode } = res
        let error
        let rawData = ''
        if (statusCode !== 200) {
          error = new Error(`Request Failed.\nStatus Code: ${statusCode}`)
        }
        if (error) {
          // consume 404 response data
          logger.error(error.message)
          logger.error('Another process that is not the HTMLValidator is using this port already. Quitting the initialization of your app')
          process.exit(1)
        }
        res.setEncoding('utf8')

        res.on('data', (chunk) => {
          rawData += chunk
        })

        res.on('end', () => {
          if (rawData.includes('Nu Html Checker')) {
            logger.log('✅', `Detached validator found on port: ${validatorOptions.port}`.green)
            clearTimeout(validatorTimeout)
            logger.log('🎧', `HTML validator listening on port: ${params.htmlValidator.port}`.bold)
            applyValidatorMiddleware()
            resolve()
          } else {
            // print out an error that another process is using the port
            logger.error('Another process that is not the HTMLValidator is using this port already. Quiting the initialization of your app')
            process.exit(1)
          }
        })
      }).on('error', () => {
        // spawn a new one
        javaCheck(spawnNewValidator)
      })

      function spawnNewValidator () {
        validatorProcess = spawn(
          'java', ['-Xss1024k', '-cp', vnu, 'nu.validator.servlet.Main', params.htmlValidator.port], { detached: params.htmlValidator.separateProcess.enable }
        )
        logger.log('☕️', 'Starting HTML validator...'.yellow)
        validatorProcess.stdout.on('data', (data) => {
          logger.verbose(`htmlValidator line 96 data from stdout is ${data}`)
          if (data.includes('Starting static initializer')) {
            var start = Date.now()
            logger.log(`start type is ${typeof start}`)
            logger.log(`Started static initializer at ${start}`)
          }
          if (data.includes('Reading miscellaneous properties')) {
            var end = Date.now()
            logger.log(`end type is ${typeof end}`)
            try {
              var timeToRun = Math.floor(end - start)
            } catch (e) {
              logger.log(`error using Math.floor: ${e.message}`)
            }
            logger.log(`timeToRun is NaN: ${Number.isNan(timeToRun)}`)
            start = Date.now()
            logger.log(`Done initializing at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started reading properties at ${start}`)
          }
          if (data.includes('Starting to loop over config file lines')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Done reading properties at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started looping at ${start}`)
          }
          if (data.includes('Finished reading config')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Done looping at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started converting config to arrays at ${start}`)
          }
          if (data.includes('Converted config to arrays')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Done converting at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started preparing namespace array at ${start}`)
          }
          if (data.includes('Prepared namespace array')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Done preparing at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started parsing doctype numbers into ints at ${start}`)
          }
          if (data.includes('Parsed doctype numbers into ints')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Done parsing at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started finding cache path prefix at ${start}`)
          }
          if (data.includes('cache path prefix')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Done finding cache path prefix at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
          }
          if (data.includes('Starting to read schemas')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            var startSchemas = Date.now()
            logger.log(`Started parsing setup and reading schemas at ${start}`)
          }
          if (data.includes('Will load schema: http://s.validator.nu/html5.rnc')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Schema parsed at at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started parsing next schema at ${start}`)
          }
          if (data.includes('Will load schema: http://s.validator.nu/html5-its.rnc')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Schema parsed at at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started parsing next schema at ${start}`)
          }
          if (data.includes('Will load schema: http://s.validator.nu/html5-rdfalite.rnc')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Schema parsed at at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started parsing next schema at ${start}`)
          }
          if (data.includes('Will load schema: http://s.validator.nu/xhtml10/xhtml-strict.rnc')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Schema parsed at at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started parsing next schema at ${start}`)
          }
          if (data.includes('Will load schema: http://s.validator.nu/xhtml10/xhtml-transitional.rnc')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Schema parsed at at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started parsing next schema at ${start}`)
          }
          if (data.includes('Will load schema: http://s.validator.nu/xhtml10/xhtml-frameset.rnc')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Schema parsed at at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started parsing next schema at ${start}`)
          }
          if (data.includes('Will load schema: http://s.validator.nu/xhtml5.rnc')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Schema parsed at at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started parsing next schema at ${start}`)
          }
          if (data.includes('Will load schema: http://s.validator.nu/xhtml5-rdfalite.rnc')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Schema parsed at at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started parsing next schema at ${start}`)
          }
          if (data.includes('Will load schema: http://s.validator.nu/xhtml1-ruby-rdf-svg-mathml.rnc')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Schema parsed at at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started parsing next schema at ${start}`)
          }
          if (data.includes('Will load schema: http://s.validator.nu/svg-xhtml5-rdf-mathml.rnc')) {
            end = Date.now()
            timeToRun = (end - start)
            start = Date.now()
            logger.log(`Schema parsed at at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Started parsing next schema at ${start}`)
          }
          if (data.includes('Schemas read')) {
            end = Date.now()
            timeToRun = (end - start)
            var timeToReadSchemas = (end - startSchemas)
            start = Date.now()
            logger.log(`Schema parsed at at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
            logger.log(`Took ${timeToReadSchemas} to read schemas`)
          }
          if (data.includes('Reading spec')) {
            start = Date.now()
            logger.log(`Started reading spec at ${start}`)
          }
          if (data.includes('Spec read')) {
            end = Date.now()
            timeToRun = (end - start)
            logger.log(`Done reading spec at ${end}`)
            logger.log(`Took ${timeToRun} seconds to run`)
          }
        })
        validatorProcess.stderr.on('data', (data) => {
          logger.verbose(`htmlValidator line 99 data from stderr is ${data}`)
          if (`${data}`.includes('INFO:oejs.Server:main: Started')) {
            clearTimeout(validatorTimeout)
            if (params.htmlValidator.separateProcess.enable) {
              logger.log('🎧', `HTML validator listening on port: ${params.htmlValidator.port} (as a detached, backgrounded process)`.bold)
            } else {
              logger.log('🎧', `HTML validator listening on port: ${params.htmlValidator.port}`.bold)
            }
            applyValidatorMiddleware()
            resolve()
          }
        })

        validatorTimeout = setTimeout(() => {
          validatorProcess.kill('SIGINT')
          params.htmlValidator.enable = false
          reject(new Error('HTML validator has been disabled because it has timed out.'))
        }, 120000)
      }

      function javaCheck (cb) {
        javaDetectProcess = spawn('java', ['-version'])

        javaDetectProcess.on('error', () => {
          reject(new Error('You must install Java to continue. HTML validation disabled, error on initialization (check to make sure Java is installed and in your path)'))
        })

        javaDetectProcess.stderr.on('data', (data) => {
          if (data.includes('java version')) {
            cb()
          }
        })
      }
    }).then(result => {
      clearTimeout(validatorTimeout)
      autoKillerStart(callback)
    }).catch(error => {
      logger.verbose(`${error}`.red)
      clearTimeout(validatorTimeout)
      callback()
    })
  }

  function applyValidatorMiddleware () {
    let render = app.response.render

    app.response.render = function (view, model, callback) {
      if (model[modelException]) {
        this.req.headers[headerException] = true
      }
      render.apply(this, arguments)
    }
    app.use(tamper((req, res) => {
      let options = {
        format: 'text',
        validator: `http://localhost:${params.htmlValidator.port}`
      }
      let detectErrors
      let errorList
      let warnings
      let warningList
      let pageTitle
      let pageHeader
      let markup
      let markupArray
      let markupLine
      let errorMap = new Map()
      let formattedHTML
      let model = {}

      // utility function to parse html validation messages from JSON
      function parseValidatorMessage (data) {
        let validationMessage = ''
        // print message on first line
        validationMessage += `${data.message}\n`

        // determine format of line/column numbers before adding them to message
        if (data.firstLine) {
          validationMessage += `From line ${data.firstLine}, column ${data.firstColumn}; to line ${data.lastLine}, column ${data.lastColumn}`
          if (data.type === 'error') {
            errorMap.set(data.firstLine, data.message)
            errorMap.set(data.lastLine, data.message)
          }
        } else {
          validationMessage += `At line ${data.lastLine}, column ${data.lastColumn}`
          if (data.type === 'error') {
            errorMap.set(data.lastLine, data.message)
          }
        }

        // add a line break after the message
        validationMessage += '\n\n'

        return validationMessage
      }

      if (req.headers[headerException]) {
        res.set(headerException, true)
      }

      if (res.statusCode === 200 && res.getHeader('Content-Type') && res.getHeader('Content-Type').includes('text/html') && !res.getHeader(headerException)) {
        return body =>
          new Promise((resolve) => {
            options.data = body
            options.format = 'json'

            validator(options, (error, htmlErrorData) => {
              if (error) {
                logger.error(error)
                detectErrors = true
                pageTitle = 'Cannot connect to validator'
                pageHeader = 'Unable to connect to HTML validator'
              } else {
                pageTitle = 'HTML did not pass validation'
                pageHeader = 'HTML did not pass validator:'
                errorList = '<h2>Errors:</h2>\n<pre class="validatorErrors">'
                warningList = '<h2>Warnings:</h2>\n<pre class="validatorWarnings">'

                // parse html validation data
                htmlErrorData.messages.forEach((item) => {
                  if (item.type === 'error') {
                    detectErrors = true
                    errorList += parseValidatorMessage(item)
                  } else {
                    warnings = true
                    warningList += parseValidatorMessage(item)
                  }
                })

                errorList += '</pre>'
                warningList += '</pre>'

                if (!params.htmlValidator.showWarnings || !warnings) {
                  warningList = undefined
                }
              }

              markup = body
              // Highlight and add line numbers to html
              formattedHTML = `<pre class='markup'>\n<code class="language-html">\n`
              markupArray = markup.split('\n')
              for (i = 0; i < markupArray.length; i++) {
                markupLine = markupArray[i]
                if (errorMap.has(i + 1)) {
                  formattedHTML += `<span title='${errorMap.get(i + 1)}' class='line-numbers error'>`
                  formattedHTML += Prism.highlight(`${markupLine}`, Prism.languages.markup)
                  formattedHTML += `</span>`
                } else {
                  formattedHTML += `<span class='line-numbers'>`
                  formattedHTML += Prism.highlight(`${markupLine}`, Prism.languages.markup)
                  formattedHTML += `</span>`
                }
              }
              formattedHTML += `</code>\n</pre>`
              // build markup template
              formattedHTML = `<h2>Markup used:</h2>\n${formattedHTML}`

              if (detectErrors) {
                res.status(500)
                model.prismStyle = prismStyleSheet.toString()
                model.pageTitle = pageTitle
                model.preWidth = markupArray.length.toString().length * 8
                model.pageHeader = pageHeader
                model.errors = errorList
                model.warnings = warningList
                model.markup = formattedHTML
                body = template(validatorErrorPage, model)
              }
              resolve(body)
            })
          })
      }
    }))
  }

  function autoKillerStart (cb) {
    // make sure that the html Validator is enabled, that it is on a separate process, and that the autoKiller is set to true
    if (params.htmlValidator.separateProcess.enable && params.htmlValidator.separateProcess.autoKiller) {
      let humanReadableTimeout = millisecondsToStr(params.htmlValidator.separateProcess.autoKillerTimeout)

      // see if a PID Text File exists
      let PIDPath = path.join(os.tmpdir(), 'roosevelt_validator_pid.txt')
      let test = fs.existsSync(PIDPath)
      if (test === true) {
        // if there is one, grab the PID number from the process.env and then kill it
        let contents = fs.readFileSync(PIDPath).toString('utf8')
        let PID = parseInt(contents)
        fkill(PID, { force: true }).then(() => {
          // if it finds a process and kills it, state that we are restarting autoKiller and fire autoKillValidator as a child process, also deletes the temp file
          logger.verbose('⏳', `Respawning a process to automatically kill the detached validator after ${humanReadableTimeout} of inactivity`)
          fs.unlinkSync(PIDPath)
          let autokiller = spawn('node', [`${path.join(__dirname, 'scripts/autoKillValidator.js')}`, `${params.port}`, `${params.htmlValidator.separateProcess.autoKillerTimeout}`, params.logging.verbose], { detached: true, stdio: 'inherit', shell: false, windowsHide: true })
          autokiller.unref()
          cb()
        }, () => {
          // if the process was closed alreadly, state that there was no process found and that roosevelt is creating a new autoKiller and fire autoKillValidator as a child process, also deletes the temp file
          logger.verbose('⏳', `Spawning a process to automatically kill the detached validator after ${humanReadableTimeout} of inactivity`)
          fs.unlinkSync(PIDPath)
          let autokiller = spawn('node', [`${path.join(__dirname, 'scripts/autoKillValidator.js')}`, `${params.port}`, `${params.htmlValidator.separateProcess.autoKillerTimeout}`, params.logging.verbose], { detached: true, stdio: 'inherit', shell: false, windowsHide: true })
          autokiller.unref()
          cb()
        })
      } else {
        // if a PID text file doesn't exist, state that there was no autoKiller running, that the app is creating a new autoKiller, and then fire autoKillValidator as a child process
        logger.verbose('⏳', `Spawning a process to automatically kill the detached validator after ${humanReadableTimeout} of inactivity`)
        let autokiller = spawn('node', [`${path.join(__dirname, 'scripts/autoKillValidator.js')}`, `${params.port}`, `${params.htmlValidator.separateProcess.autoKillerTimeout}`, params.logging.verbose], { detached: true, stdio: 'inherit', shell: false, windowsHide: true })
        autokiller.unref()
        cb()
      }
    } else {
      // if htmlValidator is either not enabled, or not on a separate process, fire the callback function given to it
      cb()
    }

    function millisecondsToStr (milliseconds) {
      function numberEnding (number) {
        return (number > 1) ? 's' : ''
      }

      let temp = Math.floor(milliseconds / 1000)
      let hours = Math.floor((temp %= 86400) / 3600)
      if (hours) {
        return hours + ' hour' + numberEnding(hours)
      }
      let minutes = Math.floor((temp %= 3600) / 60)
      if (minutes) {
        return minutes + ' minute' + numberEnding(minutes)
      }
      let seconds = temp % 60
      return seconds + ' second' + numberEnding(seconds)
    }
  }
}
