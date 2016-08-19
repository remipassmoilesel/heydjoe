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
  processRessourcesInText : function(text) {

    var self = jsxc.ressources;

    /**
     * Manager and ressource stack serves to prevent two filter to process
     * the same ressource.
     *
     * Every filter have to test ressource before process it and
     * register before processing
     * @type {Array}
     * @private
     */
    var _resStack = [];
    var manager = {

      _resStack : [],

      /**
       * Save ressource processed to prevent that
       * other filter process it after
       * @param res
       */
      saveRessource : function(res) {
        _resStack.push(res);
      },

      /**
       * Return true if filter can process ressource
       * @param res
       * @returns {boolean}
       */
      isFree : function(res) {
        return _resStack.indexOf(res) === -1;
      }
    };

    // iterate filters
    $.each(self.MEDIA_RESSOURCES, function(index, filter) {

      // here regex must be an array !
      if (filter.regex.constructor !== Array) {
        throw new Error("'regex' must be an array");
      }

      var name = filter.name;

      var replaceFilter = function(match) {

        // ressource have not been processed
        if (manager.isFree(match)) {

          manager.saveRessource(match);

          // if filter provide link ask it
          if (filter.getLink) {
            // ask link with same arguments as filter function for replace
            // to get access to all capturing groups
            return filter.getLink.apply(self, arguments);
          }

          // otherwise default is show in mediapanel
          else {
            return self._getShowRessourceLink(match, name);
          }

        }

        // ressource have already be processed
        else {
          return match;
        }

      };

      for (var i = 0; i < filter.regex.length; i++) {

        var regex = filter.regex[i];

        // text match filter
        if (text.match(regex)) {
          text = text.replace(regex, replaceFilter);
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

    {
      name : 'http/https',

      //https://www.youtube.com/watch?v=FbuluDBHpfQ
      regex : [jsxc.CONST.REGEX.URL],

      getLink : function(match) {
        var self = jsxc.ressources;
        return self._getTrueLink(match);
      }

    },

    {
      name : 'etherpad',

      //++etherpad:etherpadid
      //++e:etherpadid
      regex : [/\+\+(e|etherpad):([-_a-z0-9]+)/ig],

      getLink : function(match, prefix, etherpadId) {
        var self = jsxc.ressources;
        return self._getEtherpadLink(etherpadId);
      }

    },

    {
      name : 'spaceInvasion',

      //++etherpad:etherpadid
      //++e:etherpadid
      regex : [/\+\+(spaceinvasion)/ig],

      getLink : function() {
        var self = jsxc.ressources;
        return self._getSpaceInvasionLink();
      }

    },

    {
      name : 'user',

      //++remi
      regex : [/\+\+([-_a-z0-9]+)/ig],

      getLink : function(match, user) {
        var self = jsxc.ressources;
        return self._getChatLink(user);
      }

    }

  ],

  /**
   * Return embedded code for a ressource
   * @param name
   * @param ressourceOnly
   * @returns {*}
   */
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

    if (media.getEmbedded) {
      return media.getEmbedded(ressourceOnly);
    }

    else {
      return null;
    }

  },

  _getEmbeddedErrorBlock : function(ressource) {
    return "<div class='jsxc-multimedia-error-block'>Erreur de traitement de la ressource: " +
        "<br/>" + ressource + "</div>";
  },

  /**
   * Return an HTML/Javascript link to open a ressource
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

    var title = "Ouvrir: " + ressource;

    // return HTML link
    return '<a class="jsxc-media-ressource-link" title="' + title +
        '" onclick="jsxc.newgui.openMediaRessource(\'' + ressource + '\')">' + ressourceLabel +
        '</a>';
  },

  /**
   * Return a link to chat with someone
   * @param user
   * @returns {string}
   * @private
   */
  _getChatLink : function(user) {

    // format ressource to show it
    var ressourceLabel = user.length < 50 ? user : user.substr(0, 17) + "...";

    var jid = user + "@" + jsxc.options.xmpp.domain;

    var title = "Discuter avec: " + user;

    return '<a class="jsxc-media-ressource-link" title="' + title +
        '" onclick="jsxc.api.openChatWindow(\'' + jid + '\')">' + ressourceLabel + '</a>';
  },

  /**
   * Return a link to chat with someone
   * @param user
   * @returns {string}
   * @private
   */
  _getEtherpadLink : function(etherpadId) {

    // format ressource to show it
    var ressourceLabel = etherpadId.length < 50 ? etherpadId : etherpadId.substr(0, 17) + "...";

    var title = "Ouvrir un pas: " + etherpadId;

    return '<a class="jsxc-media-ressource-link" title="' + title +
        '" onclick="jsxc.etherpad.openpad(\'' + etherpadId + '\')">' + ressourceLabel + '</a>';
  },

  _getTrueLink : function(href) {

    // format ressource to show it
    var ressourceLabel = href.length < 50 ? href : href.substr(0, 17) + "...";

    var title = "Ouvrir dans une nouvelle fenêtre: " + href;

    return '<a class="jsxc-media-ressource-link" title="' + title + '" target="_blank" href="' +
        href + '">' + ressourceLabel + '</a>';

  },

  _getSpaceInvasionLink : function() {
    return '<a class="jsxc-media-ressource-link" title="Space Invasion !" ' +
        'onclick="jsxc.api.spaceInvasion()">Space Invasion !</a>';
  }

};