const fse = require('fs-extra')

module.exports = function (appDir, next) {
  // use regexp to make sure that the appDir included 'roosevelt' with any characters following it followed by '/test/app'
  if (/roosevelt.*[\\/]test[\\/]app/.test(appDir)) {
    fse.remove(appDir, (err) => {
      if (err) {
        next(err)
      } else {
        next()
      }
    })
  } else {
    next(new Error(`Directory ${appDir} is not a test app and will not be deleted.`))
  }
}
