/**
 * Here go all ressources search stuff.
 *
 * This analyse allow to enlighten links, videos, ...
 *
 * @memberOf jsxc
 */

//TODO: Etherpad
//TODO: Videoconference
//TODO: ...

//TODO: Etherpad
//TODO: Videoconference
//TODO: ...

//TODO: Etherpad
//TODO: Videoconference
//TODO: ...

jsxc.ressources = {

  _log : function(message, data, level) {
    jsxc.debug('[RESSOURCES] ' + message, data, level);
  },

  /**
   * Analyse text and return HTML code containing links to display ressources in the ressource
   * panel
   */
  enlightenRessourcesInText : function(text) {

    var self = jsxc.ressources;

    $.each(self.MEDIA_RESSOURCES, function(index, filter) {

      // here regex must be an array !
      if (filter.regex.constructor !== Array) {
        throw new Error("'regex' must be an array");
      }

      for (var i = 0; i < filter.regex.length; i++) {

        var regex = filter.regex[i];

        if (text.match(regex)) {
          text = text.replace(regex, filter.filterFunction);
        }

      }

    });

    //self._log("Output: ", text);

    return text;
  },

  //TODO: Etherpad
  //TODO: Videoconference
  //TODO: ...
  MEDIA_RESSOURCES : [

    {
      name : 'youtube',

      //https://www.youtube.com/watch?v=FbuluDBHpfQ
      regex : [/https?:\/\/(www\.)?youtube\.[a-z]{1,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig],

      filterFunction : function() {
        var self = jsxc.ressources;
        var match = arguments[0];
        return self._getShowRessourceLink(match, 'youtube');
      },

      getEmbedded : function(ressourceOnly) {
        var self = jsxc.ressources;

        // get video id from ressource
        // https://www.youtube.com/watch?v=FbuluDBHpfQ.match(/v=([^&]+)/i);
        var vid = ressourceOnly.match(/v=([^&]+)/i);

        if (vid === null) {
          return self._getEmbeddedErrorBlock();
        }

        return '<iframe src="https://www.youtube.com/embed/' + vid[1] +
            '" frameborder="0" width="480" height="270" allowfullscreen></iframe>';
      }

    },

    {
      name : 'dailymotion',

//https://www.youtube.com/watch?v=FbuluDBHpfQ
      regex : [/https?:\/\/(www\.)?dailymotion\.[a-z]{1,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig],

      filterFunction : function() {
        var self = jsxc.ressources;
        var match = arguments[0];
        return self._getShowRessourceLink(match, 'dailymotion');
      },

      getEmbedded : function(ressourceOnly) {
        var self = jsxc.ressources;

        // get video id from ressource
        // http://www.dailymotion.com/video/x2i3isg_zap-meta-le-zapping-de-meta-tv-2015-semaine-9_news
        var vid = ressourceOnly.match(/video\/([^_]+)/i);

        if (vid === null) {
          return self._getEmbeddedErrorBlock();
        }

        return '<iframe frameborder="0" width="480" height="270" ' +
            'src="//www.dailymotion.com/embed/video/' + vid[1] + '" ' + 'allowfullscreen></iframe>';

      }

    },

//     {
//       name : 'http/https',
//
// //https://www.youtube.com/watch?v=FbuluDBHpfQ
//       regex : [jsxc.CONST.REGEX.URL],
//
//       filterFunction : function() {
//         var self = jsxc.ressources;
//         var match = arguments[0];
//         return self._getTrueLink(match);
//       },
//
//       getEmbedded : function() {
//         // don't return anything, just open in a naew window
//         return null;
//       }
//
//     }

  ],

  getEmbeddedFor : function(name, ressourceOnly) {

    var self = jsxc.ressources;

    var media = null;
    $.each(self.MEDIA_RESSOURCES, function(index, element) {
      if (element.name === name) {
        media = element;
        return false;
      }
    });

    if (!name || !media) {
      throw new Error("Invalid ressource: " + name + " / " + ressourceOnly);
    }

    return media.getEmbedded(ressourceOnly);
  },

  _getEmbeddedErrorBlock : function(ressource) {
    return "<div class='jsxc-multimedia-error-block'>Erreur de traitement de la ressource: " +
        "<br/>" + ressource + "</div>";
  },

  /**
   * Return an HTML link
   * @param ressource
   * @returns {string}
   * @private
   */
  _getShowRessourceLink : function(ressource, prefix) {

    if (typeof ressource === 'undefined') {
      throw new Error('Ressource cannot be undefined');
    }
    if (typeof prefix === 'undefined') {
      throw new Error('Prefix cannot be undefined');
    }

    // format ressource to show it
    var ressourceLabel = ressource.length < 50 ? ressource : ressource.substr(0, 17) + "...";

    // add prefix to ressource
    ressource = prefix ? prefix + ":" + ressource : ressource;

    // return HTML link
    return '<a class="jsxc-media-ressource-link" onclick="jsxc.newgui.openMediaRessource(\'' +
        ressource + '\')">' + ressourceLabel + '</a>';
  },

  _getTrueLink : function(href) {

    // format ressource to show it
    var ressourceLabel = href.length < 50 ? href : href.substr(0, 17) + "...";

    return '<a class="jsxc-media-ressource-link" target="_blank" href="' + href + '">' +
        ressourceLabel + '</a>';

  }

};