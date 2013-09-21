$.fn.editable.defaults.mode = 'inline';
(function($) {
    $.getUrlParam = function(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]);
        return null;
    }
})(jQuery);
var Dba = {
    createNew: function(db) {
        var dba = {};
        dba.db = db;
        dba.fields = [];
        dba.url = '/db' + location.search;
        dba.delUrl = '/db/del/' + location.search;

        dba.alert = function(message, callback) {
            $('.alert').html(message);
            $('.alert').show();
            if (dba.alertHint) clearTimeout(dba.alertHint);
            dba.alertHint = setTimeout(function() {
                $('.alert').hide();
                dba.alertHint = null;
            }, 5000);
            if (typeof(callback) === 'function') callback();
        }

        dba.getFields = function() {
            $.getJSON('/fieldList?db=' + dba.db, function(fields) {
                if (fields.code) return dba.alert(fields.code);
                var table = $('#table')
                    .html('')
                    .addClass('table-striped');
                var row = $('<tr/>')
                    .appendTo(table);
                fields.forEach(function(item) {
                    var field = item.Field;
                    var capital = field.substring(0, 1).toUpperCase() +
                        field.substring(1);

                    dba.fields[field] = field;
                    var cell = $('<th/>')
                        .html(capital)
                        .appendTo(row);

                    var groupDiv = $('<div/>')
                        .addClass('control-group')
                        .appendTo($('#form'));

                    var label = $('<label/>')
                        .html(capital)
                        .addClass('control-label')
                        .appendTo(groupDiv);

                    var controlDiv = $('<div/>')
                        .addClass('controls')
                        .appendTo(groupDiv);

                    var input;
                    if ('script' === field) {
                        input = $('<textArea/>')
                            .attr('rows', '3')
                            .addClass('fix');
                    } else {
                        input = $('<input>')
                            .attr('type', 'text');
                    }
                    input.attr('name', field)
                        .attr('placeholder', capital)
                        .appendTo(controlDiv);

                    if ('pk' === field) {
                        $(cell).addClass('hide');
                        groupDiv.addClass('hide');
                    }
                });
                $('<th/>').appendTo(row); // for edit/del
                dba.getRestriction();
            });
        };

        dba.getData = function() {
            var url = '/db?db=' + dba.db;
            if (dba.restriction) {
                sessionStorage.setItem('choice', $('#choice').val());
                url += '&' + dba.restriction.field + '=' + $('#choice').val();
            }

            //clear old data
            $("tr:not(:first)").remove();

            $.getJSON(url, function(data) {
                if (data.error) return dba.alert(data.error);
                if (!data.length) return dba.alert('No data in ' + dba.db);
                dba.data = data;
                var count = data.length;
                data.forEach(function(record) {
                    var row = $('<tr/>')
                        .appendTo(table);
                    for (key in record) {
                        var cell = $('<td/>')
                            .html(record[key])
                            .appendTo(row);
                        if (key === 'pk') {
                            $(cell).addClass('hide');
                        }
                    }
                    var btnCell = $('<td/>')
                        .appendTo(row);
                    var btn = $('<button/>')
                        .html('Edit/Del')
                        .addClass('btn btn-small')
                        .appendTo(btnCell)
                        .on('click', function(a) {
                            var index = $(this).closest("tr").index() - 1;
                            dba.newEditDel(dba.data[index]);
                        });
                    if (--count === 0) dba.autoRowSpan($('#table')[0]);
                });
            });
        }

        dba.newEditDel = function(record) {
            $('#deleteBtn').show();
            if (!record) {
                record = {};
                $('#deleteBtn').hide();
            }
            for (field in dba.fields) {
                $('#form > div > div > [name=' + field + ']').val(record[field] || '');
            }

            $('#detailModal').modal('show');
        }

        dba.getRestriction = function() {
            $.getJSON('/restriction?db=' + dba.db, function(r) {
                if (r.field && r.url) {
                    dba.restriction = r;
                    $('#select').removeClass('hide');
                    $('#selectHint').html($('#selectHint').html() + r.field)
                    $.getJSON(r.url, function(choices) {
                        choices.forEach(function(choice) {
                            $('<option/>').val(choice[r.field])
                                .text(choice[r.field])
                                .appendTo($('#choice'));
                        });
                        var choice = sessionStorage.getItem('choice');
                        if (choice) {
                            $('#choice').val(choice);
                            dba.getData();
                        }
                    });
                    $('#get').click(dba.getData);
                } else {
                    dba.getData();
                }
            });
        }

        dba.saveRecord = function() {
            var record = {};
            var s = $('form').serializeArray();
            s.forEach(function(pair) {
                record[pair.name] = pair.value;
            });
            $.post(dba.url, s, function(data) {
                $('#detailModal').modal('hide');
                if (data.error) {
                    dba.alert(error.code);
                } else {
                    window.location.href = window.location.href;
                }
            });
        }

        dba.delRecord = function() {
            var pk = $('input[name=pk]').val();
            $.post(dba.delUrl, {
                pk: pk
            }, function(data) {
                $('#confirmModal').modal('hide');
                if (data.error) {
                    dba.alert(error.code);
                } else {
                    window.location.href = window.location.href;
                }
            });
        }

        dba.autoRowSpan = function (tb) {
            var lastValue = "";
            var value = "";
            var pos = 1;
            var row = 0;
            var col = 1;
            for (var i = row; i < tb.rows.length; i++) {
                value = tb.rows[i].cells[col].innerText;
                if (lastValue == value) {
                    tb.rows[i].deleteCell(col);
                    tb.rows[i - pos].cells[col].rowSpan = tb.rows[i - pos].cells[col].rowSpan + 1;
                    pos++;
                } else {
                    lastValue = value;
                    pos = 1;
                }
            }
        }

        dba.getComment = function (){
            var db = $.getUrlParam('db');
            $.getJSON('/getTableComment?table='+db,function(result){
                if (result.error) return dba.alert(result.error);
                $('#table-comment').html(result.table_comment);
            });
        }

        dba.init = function() {
            dba.getComment();
            dba.getFields();
            $('#add').on('click', function() {
                dba.newEditDel();
            });
            $('#deleteBtn').on('click', function() {
                $('#detailModal').modal('hide');
                $('#confirmModal').modal('show');
            });
            $('#saveBtn').on('click', dba.saveRecord);
            $('#confirmBtn').on('click', dba.delRecord);

        }
        return dba;
    }
}



$(document).ready(function() {
    var d = Dba.createNew($.getUrlParam('db'));
    d.init();
});