var dba = require('./dba'),
    gatherer = require('./gatherer'),
    viewer = require('./viewer');

module.exports = function(app) {
    gatherer(app);
    viewer(app);
    dba(app);
    app.get('/', function(req, res) {
        res.render('index', {
            title: 'Express'
        });
    });
    app.get('/chart', function(req, res) {
        res.render('chart.ejs');
    });
    app.get('/chart2', function(req, res) {
        res.render('chart2.ejs');
    });
    app.get('/freeChart', function(req, res) {
        res.render('freeChart.ejs');
    });
}