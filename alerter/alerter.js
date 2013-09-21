var redis = require('redis');
var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : '10.16.2.20',
  user     : 'monitor',
  password : '3yFG@m!',
  database : 'monitor',
});

var client = redis.createClient();
var vm = require('vm');
connection.connect(function(err){
    if (err) console.error(err);
    else console.log("Database connection OK!");

    var query = 'SELECT DISTINCT member_ip'+
    	' FROM group_members';
    connection.query(query, function(err,members){
    	if (err) console.error(err);
    	else {
    		members.forEach(function(member){
					client.on("message", check);
					client.subscribe(member.member_ip);
    		});
    	}
    });
});

function check(channel, message) {
	var dataJSON;
	try {
		dataJSON = JSON.parse(message);
		console.log(dataJSON);
		var query = 'SELECT group_check.check'+
			' FROM group_check, group_members'+
			' WHERE group_members.member_ip='+connection.escape(channel)+
				' AND group_members.group_id = group_check.group_id';
		var context = dataJSON;
		connection.query(query, function(err,check){
			if (err) console.log(err);
			else{
				var command = 'function check(){'+check[0].check+'}\ncheck();'
				console.log(vm.runInNewContext(command,context));
			}
		});
	} catch(err) {
		console.error(err);
	}
	//console.log(channel + ": " + message);
}

