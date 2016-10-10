/**
 * This namespace handle the notice system.
 *
 * @namspace jsxc.notice
 * @memberOf jsxc
 */
jsxc.notice = {

  /** Number of notices. */
  _num : 0,

  /**
   * Loads the saved notices.
   *
   * @memberOf jsxc.notice
   */
  load : function() {

    var self = this;

    // reset list
    $('#jsxc-notifications ul li').remove();

    $('#jsxc-root .jsxc_menu_notif_number').text('');
    jsxc.notice._num = 0;

    var saved = jsxc.storage.getUserItem('notices') || [];
    var key = null;

    for (key in saved) {
      if (saved.hasOwnProperty(key)) {
        var val = saved[key];

        // add notice but do not trigger event for each
        jsxc.notice.add(val.msg, val.description, val.fnName, val.fnParams, key, false);
      }
    }

    self._showNoNoticeContent();

    $(document).trigger("notice.jsxc");
  },

  /**
   * Display "No notifications" in notifications list if there are no notifications
   * @private
   */
  _showNoNoticeContent : function() {
    if ($('#jsxc-notifications ul li').length < 1) {
      $('#jsxc-notifications ul').append(
          "<li class='jsxc_noNotice'>" + jsxc.t('no_notifications') + "</li>");
    }

    else {
      $('#jsxc-notifications .jsxc_noNotice').remove();
    }
  },

  /**
   * Add a new notice to the stack
   *
   * Trigger an event by default
   *
   * Id is specified when we are loading old events stored in browser
   *
   * @memberOf jsxc.notice
   * @param msg Header message
   * @param description Notice description
   * @param fnName Function name to be called if you open the notice
   * @param fnParams Array of params for function
   * @param id Notice id
   */
  add : function(msg, description, fnName, fnParams, id, triggerEvent) {

    var self = this;

    // trigger an jquery event by default
    triggerEvent = typeof triggerEvent === "undefined" ? true : false;

    // id of notice, now or previous choosen id
    var nid = id || Date.now();
    var list = $('#jsxc-notifications ul');

    // create notice and append it to the notice list
    var notice = $('<li/>');
    notice.click(function() {

      // remove notice
      jsxc.notice.remove(nid);

      // exec attached function
      jsxc.exec(fnName, fnParams);

      // trigger event, number of notices changed
      $(document).trigger("notice.jsxc");

      return false;
    });

    notice.html("<b>" + msg + "</b><br/>" + description);
    notice.attr('title', description || '');
    notice.attr('data-nid', nid);
    list.append(notice);

    // update totla notifications number
    jsxc.notice._num++;
    self.updateNotificationNumbers();

    if (!id) {
      var saved = jsxc.storage.getUserItem('notices') || {};
      saved[nid] = {
        msg : msg, description : description, fnName : fnName, fnParams : fnParams
      };

      jsxc.storage.setUserItem('notices', saved);

      jsxc.notification.notify(msg, description || '', null, true, jsxc.CONST.SOUNDS.NOTICE);
    }

    // show no notice content if needed
    self._showNoNoticeContent();

    if (triggerEvent) {
      $(document).trigger("notice.jsxc");
    }
  },

  /**
   * Update places where are displayed notification numbers
   */
  updateNotificationNumbers : function() {
    $('#jsxc-root .jsxc_menu_notif_number').text(jsxc.notice._num);
  },

  /**
   * Get notification numbers
   * @returns {number}
   */
  getNotificationsNumber : function() {
    return jsxc.notice._num || 0;
  },

  /**
   * Removes notice from stack
   *
   * @memberOf jsxc.notice
   * @param nid The notice id
   */
  remove : function(nid) {

    var self = this;

    var el = $('#jsxc-notifications li[data-nid=' + nid + ']');

    el.remove();
    $('#jsxc-root .jsxc_menu_notif_number').text(--jsxc.notice._num || '');

    var s = jsxc.storage.getUserItem('notices');
    delete s[nid];
    jsxc.storage.setUserItem('notices', s);

    self.updateNotificationNumbers();

    self._showNoNoticeContent();
  },

  /**
   * Check if there is already a notice for the given function name.
   *
   * @memberOf jsxc.notice
   * @param {string} fnName Function name
   * @returns {boolean} True if there is >0 functions with the given name
   */
  has : function(fnName) {
    var saved = jsxc.storage.getUserItem('notices') || [];
    var has = false;

    $.each(saved, function(index, val) {
      if (val.fnName === fnName) {
        has = true;

        return false;
      }
    });

    return has;
  }
};
