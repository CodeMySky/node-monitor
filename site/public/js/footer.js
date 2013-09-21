var Footer = {
    createNew: function() {
        var footer = {};
        footer.getView = function() {
            $.getJSON('/viewList', function(views) {
                var viewMenu = $('#viewMenu');
                $('<li/>').addClass('divider')
                    .appendTo(viewMenu);
                var subli = $('<li/>').addClass('dropdown-submenu')
                    .appendTo(viewMenu);
                var suba = $('<a/>').text('视图')
                    .attr('tabindex', '-1')
                    .appendTo(subli);
                var subul = $('<ul/>')
                    .addClass('dropdown-menu')
                    .appendTo(subli);
                views.forEach(function(view) {
                    var li = $('<li/>').appendTo(subul);
                    var a = $('<a/>').text(view.view_name)
                        .attr('tabindex', '-1')
                        .attr('name', view.view_name)
                        .appendTo(li)
                        .attr('href', '/freeChart?view=' + view.view_name);
                });
            });
        }
        footer.init = function(){
            footer.getView();
        }
        footer.init();
        return footer;
    }
}
$(document).ready(function(){
    var f = Footer.createNew();
});