(function($) {
  $.getUrlParam = function(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
  }
})(jQuery);
var Chart = {
  createNew: function() {
    var chart = {};
    chart.startTime = moment().subtract('days', 7).unix();
    chart.endTime = moment().unix();
    chart.field_name = [];
    chart.ip = [];
    chart.setTarget = function() {
      $('#target').typeahead([{
        name: 'Group',
        prefetch: {
          url: '/groupList',
          ttl: 10,
          filter: function(groups) {
            var groupArray = [];
            groups.forEach(function(group) {
              groupArray.push(group.group_id + '');
            });
            return groupArray;
          }
        },
        header: '<h4>Group</h4>'
      }, {
        name: 'IP',
        prefetch: {
          url: '/memberList',
          ttl: 10,
          filter: function(members) {
            var memberArray = [];
            members.forEach(function(member) {
              memberArray.push(member.member_ip);
            });
            return memberArray;
          },
        },
        header: '<h4>IP</h4>'
      }]);
      $('#target').on('typeahead:closed', function(a) {
        chart.getGroupMembers();
      });
    };

    chart.getGroupMembers = function(callback) {
      var target = $('#target').val();
      chart.ip = [];
      if (!target) return;
      if (target.length < 7) {
        $.getJSON('/memberList?group_id=' + target, function(results) {
          if (results.error) return chart.alert(results.error);
          if (results.length === 0) return chart.alert('Group ' + target + ' has no members');
          results.forEach(function(result) {
            chart.ip.push(result.member_ip);
          });
          if (typeof(callback) === 'function')
            callback();
        });
      } else if (target) {
        chart.ip = [target];
        if (typeof(callback) === 'function')
          callback();
      }
    }

    chart.setField = function() {
      $('#field').typeahead([{
        name: 'Chart',
        remote: {
          url: '',
          replace: function(a) {
            if ($('#target').val())
              return '/getTargetCharts?target=' + $('#target').val();
            else
              return;
          },
          filter: function(charts) {
            var chartArray = [];
            charts.forEach(function(chart) {
              chartArray.push(chart.chart_name);
            });
            return chartArray;
          },
          ttl: 10
        },
        header: '<h4>Chart</h4>'
      }, {
        name: 'Field',
        remote: {
          url: '',
          replace: function(a) {
            if ($('#target').val())
              return '/getTargetFields?target=' + $('#target').val();
            else
              return;
          },
          filter: function(fields) {
            var fieldArray = [];
            fields.forEach(function(field) {
              fieldArray.push(field.field_name);
            });
            return fieldArray;
          },
          ttl: 10
        },
        header: '<h4>Field</h4>'
      }]);
    };

    chart.processFields = function(callback) {
      var item = $('#field').val();
      if (item === '') reuturn;
      chart.field_name = [];
      if (item.indexOf('.') < 0) {
        chart.getChartFields(item, callback);
      } else if (item) {
        chart.field_name = [item];
        if (typeof(callback) === 'function')
          callback();
      }
    }

    chart.getChartFields = function(chartname, callback) {
      $.getJSON('/getChartFields?chart=' + chartname, function(results) {
        if (results.error) return chart.alert(results.error);
        if (!results) return chart.alert('No such chart ' + chartname);
        chart.field_name = [];
        results.forEach(function(result) {
          chart.field_name.push(result.field_name);
        });
        if (typeof(callback) === 'function')
          callback();
      });
    }

    chart.setTime = function() {
      moment.lang('zh-cn');
      $('#reportrange').daterangepicker({
          startDate: moment().subtract('days', 7),
          endDate: moment(),
          maxDate: moment(),
          dateLimit: {
            years: 1
          },
          showDropdowns: true,
          showWeekNumbers: false,
          timePicker: true,
          timePickerIncrement: 1,
          timePicker12Hour: false,
          ranges: {
            'Last 5 Minutes': [moment().subtract('minutes', 5), moment()],
            'Last Hour': [moment().subtract('hours', 1), moment()],
            'Last Day': [moment().subtract('days', 1), moment()],
            'Last Week': [moment().subtract('weeks', 1), moment()],
            'Last Month': [moment().subtract('months', 1), moment()],
            'Last Year': [moment().subtract('years', 1), moment()]
          },
          opens: 'right',
          buttonClasses: ['btn btn-default'],
          applyClass: 'btn-small btn-primary',
          cancelClass: 'btn-small',
          format: 'MM/DD hh:mm',
          separator: ' to ',
          locale: {
            applyLabel: 'Search',
            fromLabel: 'From',
            toLabel: 'To',
            customRangeLabel: 'Custom Range',
            daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
            monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            firstDay: 1
          }
        },
        function(start, end) {
          chart.startTime = start.unix();
          chart.endTime = end.unix();
          $('#timefield').val(start.fromNow() + ' - ' + end.calendar());
        }
      );
      //Set the initial state of the picker label
      $('#timefield').val(moment().subtract('days', 7).fromNow() + ' - ' + moment().calendar());
    }

    chart.showData = function(data, conf) {
      var list = $('#list');
      if (list[0]) {
        var li = $('<li></li>');
        var a = $('<a></a>');
        var i = $('<i class="icon-chevron-right"></i>');
        a.html(chartId);
        a.attr('href', '#' + chartId);
        a.appendTo(li);
        li.appendTo(list);
      }

      var div = $('<div id=' + conf.chartId + '></div>');
      var chartList = $('#chartList');
      div.css('width', '600');
      div.css('height', '250');
      div.css('position', 'relative');
      div.appendTo(chartList);

      var newChart = document.getElementById(conf.chartId);
      Flotr.draw(newChart, data, {
        title: conf.title,
        selection: {
          mode: 'x',
          fps: 30
        },
        xaxis: {
          mode: 'time',
          timeMode: 'local',
          timeUnit: 'second',
          min: conf.startTime,
          max: conf.endTime
        },
        yaxis: {
          min: 0,
          autoscale: true,
          autoscaleMargin: 0.5
        },
        mouse: {
          track: true, // => true to track the mouse, no tracking otherwise
          trackAll: true,
          position: 'se', // => position of the value box (default south-east)
          relative: false, // => next to the mouse cursor
          trackFormatter: function(c) {
            var track = moment.unix(c.x).calendar() + '  Value:' + c.y;
            return track;
          }, // => formats the values in the value box
          margin: 5, // => margin in pixels of the valuebox
          lineColor: '#FF3F19', // => line color of points that are drawn when mouse comes near a value of a series
          trackDecimals: 1, // => decimals for the track values
          sensibility: 5, // => the lower this number, the more precise you have to aim to show a value
          trackY: true, // => whether or not to track the mouse in the y axis
          radius: 3, // => radius of the track point
          fillColor: null, // => color to fill our select bar with only applies to bar and similar graphs (only bars for now)
          fillOpacity: 0.4 // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill 
        },
        legend: {
          position: 'ne'
        }
      });
      Flotr.EventAdapter.observe(newChart, 'flotr:select', function(area) {
        // Draw graph with new area
        if (area.x2 - area.x1 < 60) return;
        var conf = {
          startTime: area.x1,
          endTime: area.x2,
          member_ip: chart.ip,
          field_name: chart.field_name,
        }
        chart.getData(conf);
      });
      Flotr.EventAdapter.observe(newChart, 'flotr:click', function() {
        var conf = {
          startTime: chart.startTime,
          endTime: chart.endTime,
          member_ip: chart.ip,
          field_name: chart.field_name,
        }
        chart.getData(conf);
      });
      $('#chartList').removeClass('busy');
    }

    chart.validate = function(conf) {
      if (conf.startTime >= conf.endTime)
        return chart.alert('Start time must before end time');
      if (!conf.member_ip || conf.member_ip.length == 0)
        return chart.alert('Please fill right target', function() {
          $('#target').focus();
        });
      if (!conf.field_name || conf.field_name.length == 0)
        return chart.alert('Please fill right field', function() {
          $('#field').focus();
        });
    }

    chart.getData = function(conf) {
      chart.validate(conf);
      conf.member_ip.forEach(function(member_ip) {
          var data = [];
          var countField = conf.field_name.length;
          conf.field_name.forEach(function(field_name) {
              var url = 'data?';
              var query = [];

              query.push('ip=' + member_ip);
              query.push('field=' + field_name);
              query.push('start=' + conf.startTime);
              query.push('end=' + conf.endTime);
              url += query.join('&');
              $('#chartList').addClass('busy');
              $.getJSON(url, function(results) {
                countField--;
                var d = [];
                for (var k = 0; k < results.length; k++) {
                  d.push([(results[k].timestamp), Number(results[k].value)]);
                }
                data.push({
                  data: d,
                  label: field_name
                });

                if (countField === 0) {
                  var newConf = {
                    title: member_ip,
                    chartId: member_ip + ':' + conf.field_name,
                    startTime: conf.startTime,
                    endTime: conf.endTime
                  }
                  chart.showData(data, newConf);
                }
              });
            } //for each field
          );
        } //for each member
      );
    }

    chart.alert = function(message, callback) {
      $('.alert').html(message);
      $('.alert').show();
      if (chart.alertHint) clearTimeout(chart.alertHint);
      chart.alertHint = setTimeout(function() {
        $('.alert').hide();
        chart.alertHint = null;
      }, 5000);
      if (typeof(callback) === 'function') callback();
    }

    chart.submitBtnClicked = function() {
      chart.getGroupMembers(function() {
        chart.processFields(chart.prepare)
      });
    }

    chart.prepare = function() {
      var conf = {
        startTime: chart.startTime,
        endTime: chart.endTime,
        member_ip: chart.ip,
        field_name: chart.field_name,
      }
      $('#chartList').html('');
      chart.getData(conf);
    }

    chart.view2detail = function() {
      var view = $.getUrlParam('view');
      if (view) {
        $.getJSON('/getViewContent?view=' + view, function(result) {
          if (result.error) return chart.alert(result.error);
          $('#target').typeahead('setQuery', result.group_id + '');
          $('#field').typeahead('setQuery', result.chart_name); //result.chart_name);
          chart.submitBtnClicked();
        });
      }
    }

    chart.init = function() {
      chart.setTarget();
      chart.setField();
      chart.setTime();
      chart.view2detail();
      $('#submit').on('click', chart.submitBtnClicked);
      $('.applyBtn').on('click', chart.submitBtnClicked);
    }

    return chart;
  }
}