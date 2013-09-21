(function($) {
  $.getUrlParam = function(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
  }
})(jQuery);
var group_id = $.getUrlParam('group_id');
var by = $.getUrlParam('by');
var field = $.getUrlParam('field');
var ip = $.getUrlParam('ip');
if (!group_id) {
  $.getJSON('/groupList', function(list) {
    var ul = $('<ur></ul>');
    list.forEach(function(group) {
      var li = $('<li></li>');
      var a = $('<a></a>');
      a.attr('href', location.href + '&group_id=' + group.group_id);
      a.html('group_id:' + group.group_id);
      a.appendTo(li);
      li.appendTo(ul);
    });
    ul.appendTo($('#list'));
  });
}
if (by === 'ip' && group_id && !ip){
  $.getJSON('/memberList?group_id=' + group_id, function(members){
    var ul = $('<ur></ul>');
    members.forEach(function(ip) {
      var li = $('<li></li>');
      var a = $('<a></a>');
      a.attr('href', location.href + '&ip=' + ip.member_ip);
      a.html('ip:' + ip.member_ip);
      a.appendTo(li);
      li.appendTo(ul);
    });
    ul.appendTo($('#list'));  
  });
}
if (by === 'ip' && group_id && ip){
  $.getJSON('/fieldList?group_id='+group_id, function(fields){
    fields.forEach(function(field){
      var endTime = new Date();
      var startTime = new Date(endTime.getTime() - 24 * 60 * 7 * 60 * 1000);
      var url = 'data?';
      var query = [];
      query.push('ip=' + ip);
      query.push('field=' + field.field_name);
      query.push('start=' + startTime.getTime() / 1000);
      query.push('end=' + endTime.getTime() / 1000);
      url += query.join('&');
      console.log(url);
      $.getJSON(url, function(data) {
        showData(data, ip + field.field_name);
      });
    });
  });
}
if (by === 'field' && group_id && !field) {
  $.getJSON('/fieldList?group_id=' + group_id, function(list) {
    var ul = $('<ur></ul>');
    list.forEach(function(field) {
      var li = $('<li></li>');
      var a = $('<a></a>');
      a.attr('href', location.href + '&field=' + field.field_name);
      a.html('field_name:' + field.field_name);
      a.appendTo(li);
      li.appendTo(ul);
    });
    ul.appendTo($('#list'));
  });
}
if (by === 'field' && group_id && field) {
  var field_name = field;
  $.getJSON('/memberList?group_id=' + group_id, function(members) {
    members.forEach(function(member) {
      var endTime = new Date();
      var startTime = new Date(endTime.getTime() - 24 * 60 * 7 * 60 * 1000);
      var url = 'data?';
      var query = [];
      query.push('ip=' + member.member_ip);
      query.push('field=' + field_name);
      query.push('start=' + startTime.getTime() / 1000);
      query.push('end=' + endTime.getTime() / 1000);
      url += query.join('&');
      $.getJSON(url, function(data) {
        showData(data, member.member_ip + field_name);
      });
    });
  });
}

function showData(dataJSON, chartId) {
        if (dataJSON.length < 2) return;
        var list = $('#list');
        var li = $('<li></li>');
        var a = $('<a></a>');
        var i = $('<i class="icon-chevron-right"></i>');
        a.html(chartId);
        a.attr('href', '#' + chartId);
        a.appendTo(li);
        li.appendTo(list);
        var data = [];
        var div = $('<div id=' + chartId + '></div>');
        var chartList = $('#chartList');
        div.css('width', '600');
        div.css('height', '250');
        div.css('position', 'relative');
        div.appendTo(chartList);
        for (var i = 0; i < dataJSON.length; i++) {
          data.push([(dataJSON[i].timestamp), Number(dataJSON[i].value)]);
        }
        var chart = document.getElementById(chartId);
        Flotr.draw(chart, [data], {
          title: chartId,
          selection: {
            mode: 'x',
            fps: 30
          },
          xaxis: {
            mode: 'time',
            timeMode: 'local',
            timeUnit: 'second',
          },
          yaxis: {
            min: 0,
            autoscale: true,
            autoscale: '20%'
          }
        });
        Flotr.EventAdapter.observe(chart, 'flotr:select', function(area) {
          // Draw graph with new area
          //$('#starttimepicker').data('datetimepicker').setLocalDate(new Date(area.x1*1000));
          //$('#endtimepicker').data('datetimepicker').setLocalDate(new Date(area.x2*1000));
          //$('#submit').trigger('click');
          /*graph = drawGraph({
              xaxis: {min:area.x1, max:area.x2},
              yaxis: {min:area.y1, max:area.y2}
            });*/
        });
      }