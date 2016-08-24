/**
 * Small utility used to display navigator storage
 *
 */
;(function($) {
  $.fn.extend({
    storageConsole : function(options) {
      this.defaultOptions = {};

      var settings = $.extend({}, this.defaultOptions, options);

      return this.each(function() {
        var $this = $(this);

        $this.empty();

        /**
         * Add a title
         *
         */
        var title = $("<div>Local and session storages</div>")
            .css({
              'font-weight' : 'bolder', 'margin' : "10px"
            });
        $this.append(title);

        /**
         * Add controls
         *
         */
        var controls = $("<div></div>")
            .css({
              'margin' : '15px'
            });

        // refresh
        $("<button>").text('Refresh').click(function() {
          update();
        }).appendTo(controls);

        // clear
        $("<button>").text('Clear local storage').click(function() {
          localStorage.clear();
          update();
        }).appendTo(controls);

        $("<button>").text('Clear session storage').click(function() {
          sessionStorage.clear();
          update();
        }).appendTo(controls);

        // log in console
        $("<button>").text('Log storages in console').click(function() {
          console.info("Storages: ");
          console.info({
            localStorage : localStorage, sessionStorage : sessionStorage
          });
        }).appendTo(controls);

        $this.append(controls);

        /**
         * Log space
         */
        var logSpace = $("<div class='storageConsole_logSpace'></div>")
            .css({
              'padding' : '10px',
              'fontSize' : '12px',
              'background' : 'black',
              'color' : 'white',
              'maxHeight' : '500px',
              'height' : '500px',
              'overflow' : 'auto'
            });

        $this.append(logSpace);

        /**
         * Empty then update console
         *
         */
        var update = function() {

          // empty
          logSpace.empty();

          // show session storage
          logSpace.append("<h3>Session storage</h3>");

          if (sessionStorage.length < 1) {
            logSpace.append('Storage is empty');
          }

          else {
            for (var i = 0; i < sessionStorage.length; i++) {
              var key = sessionStorage.key(i);
              var val = sessionStorage.getItem(key);
              appendElement(key, val);
            }
          }

          // show local storage
          logSpace.append("<h3>Local storage</h3>");
          if (localStorage.length < 1) {
            logSpace.append('Storage is empty');
          }

          else {

            for (var i = 0; i < localStorage.length; i++) {
              var key = localStorage.key(i);
              var val = localStorage.getItem(key);
              appendElement(key, val);
            }

          }

        };

        /**
         * Append an element to log space
         * @param key
         * @param val
         */
        var appendElement = function(key, val) {

          var elmt = $("<div>ID: <b>" + key + "</b> <br/>Data: " + val + "</br></div>")
              .css({
                'border' : 'solid 1px gray',
                'padding' : '5px',
                'margin' : '10px',
                'word-break' : 'break-all'
              });

          logSpace.append(elmt);
        };

        /**
         * First update
         */

        update();

      });
    }
  });
})(jQuery);
