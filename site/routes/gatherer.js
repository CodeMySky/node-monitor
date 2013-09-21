var mysql    = require('mysql');
var redis = require('redis');
var connection = require('./connection');

module.exports = function(app){
    app.get('/update', update);
    app.post('/upload',upload);
    app.get('/version',version);
}

update = function(req,res){
    var query = 
        'SELECT MIN(gc.upload_interval) AS upload_interval,\
            MIN(gc.update_detect_interval) AS update_detect_interval \
        FROM group_conf AS gc, group_members AS gm \
        WHERE gm.member_ip = ? \
        GROUP BY gm.group_id';
    var ip = req.ip;
    try {
        connection.query(query,[ip], function(err,global){
            if (err) throw new Error(err);
            if (!global[0]) throw new Error(ip+" Not in any group");
            var configure = global[0];
            var query =
            'SELECT fc.name,fc.type,fc.interval,fc.script \
             FROM group_members AS gm,group_fields AS gf, field_content AS fc \
             WHERE gm.member_ip = ? AND\
                gf.group_id = gm.group_id AND\
                fc.name = gf.field_name ';
            connection.query(query,[ip], function(err,items){
                if (err) throw new Error(err);
                configure.watch_items = items;
                getVersion(function(version){
                    configure.version = version.version;
                    res.send(configure);
                });
            });
        });
    } catch(err) {
        dealError(err,res);
    }
}

upload = function(req,res) {
    try{
        if (!req.body.data) throw new Error("No data");
        var data = req.body.data;
        //var publisher = redis.createClient();
        var count = data.length;
        var ip = req.ip;
        data.forEach(function(item){
            var query =
                'INSERT INTO `raw` (`timestamp`, `ip`, `field`, `value`)\
                 VALUES (?,?,?,?)';
            if (!item.time || !item.field || !item.value)
                throw new Error('Incomplete data type:'+JSON.stringify(item));
            connection.query(query,[item.time,ip,item.field,item.value], function(err){
                if (err) throw new Error(err);
                //publisher.publish(req.body.ip,JSON.stringify(item));
                if (!(--count)) res.send("Insertion OK");
            });
        });
    } catch (err){
        dealError(err,res);        
    }
}

version = function(req,res) {
    try{
        getVersion(function (version){
            res.send(version);
        });
    } catch (err) {
        dealError(err,res);        
    }
}

getVersion = function (callback){
    var query = 
    'SELECT UNIX_TIMESTAMP(MAX(UPDATE_TIME)) AS version\
     FROM INFORMATION_SCHEMA.tables\
     WHERE TABLE_NAME="group_members" OR\
     TABLE_NAME="group_fields" OR\
     TABLE_NAME="field_content"\
     GROUP BY TABLE_SCHEMA';
    connection.query(query, function(err,version){
        if (err) throw new Error(err);
        callback(version[0]);
    });
}
