module.exports = (app) => {
  // route to respond to teddy test and return a teddy page with a model
  app.route('/teddyTest').get((req, res) => {
    // load a data model
    var model = require(`models/teddyModel`)
    // render the teddy template and pass it the model
    res.render('teddyTest', model)
  })
}
