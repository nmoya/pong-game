var express = require('express');
var handlebars = require('handlebars');
var path = require('path');
var fs = require('fs');
var router = express.Router();

const templateFromData = (html, data) => {
  const template = handlebars.compile(html);
  return template(data);
};

const servePage = (req, res, viewPath, data) => {
  const htmlPath = path.join(__dirname, viewPath);
  fs.readFile(htmlPath, 'utf8', function (err, html) {
    res.write(templateFromData(html, data));
    res.end();
  });
}

/* GET home page. */
router.get('/', (req, res, next) => {
  servePage(req, res, '../views/index.html', { title: 'Pong game!' })
});

const error = (err, req, res) => {
  res.status(err.status || 500);
  servePage(req, res, '../views/error.html', { message: err.message });
}

module.exports = { router, error };
