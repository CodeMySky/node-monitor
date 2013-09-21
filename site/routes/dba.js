var mysql = require('mysql');
var connection = require('./connection');
var dealError = require('./dealError');

module.exports = function(app) {
    app.post('/db', changeDatabase);
    app.post('/db/del',deleteRecord);
    app.get('/dba', function(req, res) {
        res.render('dba.ejs', {
            dbname: req.query.db
        });
    });
}


changeDatabase = function(req, res) {
    console.log(req.query);
    console.log(req.body);
    var dbname = req.query.db;
    var data = req.body;
    if (!dbname) return dealError('No dbname', res);
    if (data.pk === '') {
        var query = 'INSERT INTO ?? ';
        var fields = [];
        var values = [];
        for (field in data) {
            if (field === 'pk') continue;
            fields.push(mysql.escapeId(field));
            values.push(mysql.escape(data[field]));
        }
        query += '(' + fields.join(',') + ')' +
            ' VALUES (' + values.join(',') + ')';
    } else {
        var query = 'UPDATE ?? SET';
        var pair = [];
        for (field in data) {
            if (field === 'pk') continue;
            pair.push(mysql.escapeId(field) + '=' + mysql.escape(data[field]));
        }
        query += pair.join(',');
        query += ' WHERE pk=?';
    }
    connection.query(query, [dbname, data.pk], function(err, result) {
        if (err) {
            res.send(err);
        } else res.send(result);
    });
}

deleteRecord = function(req, res) {
    var pk = req.body.pk;
    var dbname = req.query.db;
    if (!dbname) dealError('No dbname',res);
    if (!pk) dealError('No pk',res);
    var query = 'DELETE FROM ?? WHERE pk=?';
    connection.query(query, [dbname,pk],function(err,result){
        if (err) res.send(err);
        else res.send(result);
    });
}