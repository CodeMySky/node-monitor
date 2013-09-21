module.exports = function(app) {
    app.get('/db', database);
    app.get('/data', data);
    app.get('/groupList', groupList);
    app.get('/memberList', memberList);
    app.get('/getTargetFields', getTargetFields);
    app.get('/getTargetCharts', getTargetCharts);
    app.get('/getChartFields', getChartFields);
    app.get('/chartList', chartList);
    app.get('/chartConf', chartConf);
    app.get('/fieldList', fieldList);
    app.get('/restriction', restriction);
    app.get('/getGroup', getGroup);
    app.get('/viewList', viewList);
    app.get('/getViewContent', getViewContent);
    app.get('/getTableComment', getTableComment);
}

var mysql = require('mysql');
var connection = require('./connection');
var dealError = require('./dealError');

database = function(req, res) {
    var query = 'SELECT * FROM ??';
    var q = req.query;
    try {
        if (!q.db) throw new Error('No database name');
        if ((q.db === 'group_members' || q.db === 'group_fields') && !q.group_id) {
            res.send({
                error: 'Need More Parament',
                url: 'groupList'
            });
            return;
        }
        if (q.group_id) query += ' WHERE group_id=?';
        connection.query(query, [q.db, q.group_id], function(err, result) {
            if (err) throw new Error(err);
            res.json(result);
        })
    } catch (err) {
        dealError(err, res);
    }
}

data = function(req, res) {
    var q = req.query;
    try {
        if (!q.ip || !q.start || !q.end || !q.field)
            throw new Error('Not enough params' + JSON.stringify(q));
        var query =
            'SELECT MIN(timestamp) AS timestamp,AVG(value) AS value, field\
         FROM raw\
         WHERE ip=? AND (timestamp BETWEEN ? AND ?) AND\
            field=?\
         GROUP BY FLOOR(timestamp/?),field\
         ORDER BY timestamp';
        var size = [{
                unit: 1,
                length: 5 * 60
            }, //5min
            {
                unit: 60,
                length: 60 * 60
            }, //1hour
            {
                unit: 5 * 60,
                length: 60 * 60 * 24
            }, //1day
            {
                unit: 30 * 60,
                length: 60 * 60 * 24 * 7
            }, //1week
            {
                unit: 2 * 60 * 60,
                length: 60 * 60 * 24 * 31
            }, //1month
            {
                unit: 24 * 60 * 60,
                length: 60 * 60 * 24 * 365
            } //1year
        ];
        var unit = 1,
            length = q.end - q.start;
        for (var i = 0; i < size.length; i++) {
            if (length >= size[i].length)
                unit = size[i].unit;
            else break;
        }
        connection.query(query, [q.ip, q.start, q.end, q.field, unit],
            function(err, result) {
                if (err)
                    return dealError(err, res);
                res.send(result);
            }
        );
    } catch (err) {
        dealError(err, res);
    }
}

groupList = function(req, res) {
    var query =
        'SELECT DISTINCT group_id\
    FROM group_members';
    try {
        connection.query(query, function(err, result) {
            if (err)
                return dealError(err, res);
            res.send(result);
        });
    } catch (err) {
        dealError(err, res);
    }
}

memberList = function(req, res) {
    var query =
        'SELECT DISTINCT member_ip\
    FROM group_members';

    try {
        if (req.query.group_id) query += ' WHERE group_id = ?';
        connection.query(query, [req.query.group_id], function(err, result) {
            if (err) {
                return dealError(err, res);
            };
            res.send(result);
        });
    } catch (err) {
        dealError(err, res);
    }
}

getTargetFields = function(req, res) {
    var query =
        'SELECT DISTINCT group_fields.field_name\
    FROM group_members,group_fields\
    WHERE group_fields.group_id=? OR\
    (group_members.member_ip = ? AND group_members.group_id = group_fields.group_id)';
    try {
        var target = req.query.target;
        if (!target) throw new Error("No target");
        connection.query(query, [target, target], function(err, result) {
            if (err) {
                return dealError(err, res);
            };
            res.send(result);
        });
    } catch (err) {
        dealError(err, res);
    }
}

getChartFields = function(req, res) {
    var query =
        'SELECT DISTINCT field_name\
        FROM chart_fields\
        WHERE chart_name=?';
    try {
        var chart = req.query.chart;
        if (!chart) throw new Error("No chart_name");
        connection.query(query, [chart], function(err, result) {
            if (err) {
                return dealError(err, res);
            };
            res.send(result);
        });
    } catch (err) {
        dealError(err, res);
    }
}

chartList = function(req, res) {
    var query =
        'SELECT chart.title\
         FROM chart';
    try {
        connection.query(query, function(err, result) {
            if (err) return dealError(err, res);;
            res.send(result);
        });
    } catch (err) {
        dealError(err, res);
    }
}

chartConf = function(req, res) {
    var query =
        'SELECT *\
         FROM chart\
         WHERE title = ?';
    try {
        if (!req.query.title) throw new Error('No title');
        connection.query(query, [req.query.title], function(err, result) {
            if (err) return dealError(err, res);;
            res.send(result);
        });
    } catch (err) {
        dealError(err, res);
    }
}

fieldList = function(req, res) {
    var query =
        'SHOW FIELDS\
         FROM ??';
    connection.query(query, [req.query.db], function(err, result) {
        if (err) res.send(err);
        else res.send(result);
    });
}

restriction = function(req, res) {
    var r = {
        'group_members': {
            field: 'group_id',
            url: 'groupList'
        },
        'group_fields': {
            field: 'group_id',
            url: 'groupList'
        },
    }
    if (r[req.query.db]) {
        res.send(r[req.query.db]);
    } else {
        res.send({});
    }
}

getGroup = function(req, res) {
    var query =
        'SELECT group_id\
         FROM group_members\
         WHERE member_ip=?';
    connection.query(query, [req.query.ip], function(err, result) {
        if (!err) res.send(result);
    });
}

getTargetCharts = function(req, res) {
    var query =
        'SELECT DISTINCT chart_fields.chart_name\
    FROM group_members,group_fields,chart_fields\
    WHERE (group_fields.group_id=? OR\
        (group_members.member_ip = ? AND\
            group_members.group_id = group_fields.group_id) AND\
        chart_fields.field_name = group_fields.field_name)';

    try {
        var target = req.query.target;
        if (!target) throw new Error("No target");
        connection.query(query, [target, target], function(err, result) {
            if (err) {
                return dealError(err, res);
            };
            res.send(result);
        });
    } catch (err) {
        dealError(err, res);
    }
}

viewList = function(req, res) {
    var query =
        'SELECT DISTINCT view_name\
         FROM view';
    connection.query(query, function(err, result) {
        if (err)
            return dealError(err, res);
        res.send(result);
    });
}

getViewContent = function(req, res) {
    var query =
        'SELECT *\
         FROM view\
         WHERE view_name = ?';
    var view_name = req.query.view;

    if (!view_name)
        return dealError('No view_name', res);
    connection.query(query, [view_name], function(err, result) {
        if (err)
            return dealError(err, res);
        res.send(result[0]);
    });
}

getTableComment = function(req, res) {
    var query =
        'SELECT table_comment\
         FROM information_schema.tables\
         WHERE Table_Name = ?';
    var table = req.query.table;
    if (!table)
        return dealError('No table_name', res);
    connection.query(query, [table], function(err, result) {
        if (err)
            return dealError(err, res);
        res.send(result[0]);
    });

}