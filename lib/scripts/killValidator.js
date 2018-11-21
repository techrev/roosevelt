require('colors')

const ps = require('ps-node')
const fkill = require('fkill')
const logger = require('../tools/logger')();

/**
 * looks for validator and kills it when found
 * @function lookupFunction
 */
(function lookupFunction () {
  logger.verbose(`in killValidator line 12, called killValidator from ${new Error().stack}`)
  logger.log('🔎', 'Scanning for validator now...'.yellow)
  ps.lookup({
    command: 'java',
    arguments: 'nu.validator.servlet.Main'
  }, function (err, resultList) {
    if (!err) {
      if (resultList.length === 0) {
        logger.error('Could not find the validator at this time, please make sure that the validator is running.'.red)
        process.exit()
      } else {
        resultList.forEach(function (process) {
          logger.log('✅', `Validator successfully found with PID: ${process.pid}`.green)
          fkill(Number(process.pid), { force: true }).then(() => {
            logger.log('✅', `Killed process with PID: ${process.pid}`.green)
          },
          (err) => {
            logger.verbose(`in killValidator line 29, received error from fkill:`)
            if (typeof err === 'object') {
              Object.keys(err).forEach(key => {
                logger.verbose(`${key}: ${err[key]}`)
              })
            } else {
              logger.verbose(`${err}`)
            }
          })
        })
      }
    } else {
      logger.verbose(`in killValidator line 31, received error from ps lookup:`)
      if (typeof err === 'object') {
        Object.keys(err).forEach(key => {
          logger.verbose(`${key}: ${err[key]}`)
        })
      } else {
        logger.verbose(`${err}`)
      }
    }
  })
})()
