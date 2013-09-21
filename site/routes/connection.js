var dbconf = require('./config');
var mysql = require('mysql');
var connection = mysql.createConnection(dbconf);
connection.connect(function(err){
  if (err) console.error(err);
  else console.log("Database connection OK!");
});
module.exports = connection;