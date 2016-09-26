/**
 * Help module of chat client
 *
 */

jsxc.help = {

  currentTutorial : null,

  tutorials : {},

  /**
   * Get an array containing all tutorials
   */
  getAllTutorials : function() {

    var self = jsxc.help;

    var res = {};

    $.each(self.tutorials, function(index, element) {
      res[index] = element();
    });

    return res;
  },

  /**
   * Launch a visual tutorial
   * @param name
   */
  launchTutorial : function(name) {

    var self = jsxc.help;

    jsxc.stats.addEvent("jsxc.help.tutorial." + name);

    jsxc.debug("Launching tutorial", name);

    // TODO: Check if a tutorial is already running

    if (typeof self.tutorials[name] === "undefined") {
      throw new Error("Invalid tutorial name: " + name);
    }

    // make tutorial, AFTER document is ready and chat client is initiate
    var tutorial = self.tutorials[name]();

    // configure tour
    var tour = new Shepherd.Tour({

      defaults : {
        classes : 'shepherd-theme-default jsxc-help-tutorial-message',
        scrollTo : true,
        showCancelLink : true,
        buttons : [{
          text : 'x', action : function() {
            Shepherd.activeTour.cancel();
          }
        }, {
          text : '<', action : function() {
            Shepherd.activeTour.back();
          }
        }, {
          text : '>', action : function() {
            Shepherd.activeTour.next();
          }
        }]
      }
    });

    // add steps
    $.each(tutorial.steps, function(index, step) {

      // add title if not present
      if (typeof step.title === 'undefined') {
        step.title = tutorial.description;
      }

      tour.addStep(step);
    });

    // launch tutorial
    tour.start();

  },

  /**
   * Initialization of all tutorials
   */
  init : function() {

    var self = jsxc.help;

    /**
     * Options:
     * --------
     *
     * beforeShowPromise: func.bind(this, arg1,...) // A function that returns a promise. When the
     * promise resolves, the rest of
     *                                              // the show code for the step will execute.
     *
     * tetherOptions: {
     *
     *    targetOffset: '0 200px' // move pop 200px to the right
     *    targetOffset: '200px 0'  // move pop 200px to the bottom
     *
     * }
     *
     *
     *
     */

    self.tutorials["interface"] = function() {

      return {

        description : jsxc.t('interface_visit'),

        steps : [

          {
            text : jsxc.t('you_will_discover_interface'),
            beforeShowPromise : self._setAllGuiVisible.bind(self, false)
          },

          {
            attachTo : {element : '#jsxc-chat-sidebar-content', on : 'left'},

            text : [jsxc.t('conversation_panel_description'),
              jsxc.t('conversation_panel_description_2'),],

            beforeShowPromise : self._setAllGuiVisible.bind(self, true)

          },

          {
            attachTo : {element : '.jsxc-toggle-mediapanel', on : 'top'},

            text : [jsxc.t('multimedia_panel_description'),
              jsxc.t('multimedia_panel_description_2')],

            beforeShowPromise : self._setAllGuiVisible.bind(self, true),

            when : {
              'show' : function() {
                self._highlightElement('.jsxc-toggle-mediapanel');
              }
            }

          },

          {
            attachTo : {element : '#jsxc-new-gui-filter-conversations', on : 'left'},

            text : [jsxc.t('sidebar_filters_description')],

            beforeShowPromise : self._setAllGuiVisible.bind(self, true),

            when : {
              'show' : function() {
                self._highlightElement('#jsxc-new-gui-filter-conversations');
                self._highlightElement('#jsxc-new-gui-filter-users');
              }
            }
          },

          {
            attachTo : {element : '#jsxc-sidebar-content-viewport', on : 'left'},

            text : [jsxc.t('roster_description'), jsxc.t('roster_description_2')],

            when : {

              'before-show' : function() {
                $('#jsxc-new-gui-filter-users').trigger('click');
              },

              'show' : function() {
                self._highlightElement('#jsxc_buddylist');
              }

            },

            beforeShowPromise : self._setAllGuiVisible.bind(self, true)

          },

          {
            attachTo : {element : '#jsxc-toggle-actions', on : 'top'},

            text : [jsxc.t('main_menu_description'), jsxc.t('main_menu_description_2')],

            when : {
              'before-show' : function() {
                $('#jsxc-toggle-actions').trigger('click');
              },

              'show' : function() {
                self._highlightElement('#jsxc-toggle-actions');
              }
            },

            beforeShowPromise : self._setAllGuiVisible.bind(self, true),

            tetherOptions : {

              targetOffset : '-20px 0'

            }

          },

          {
            attachTo : {element : '#jsxc-select-buddies', on : 'left'},

            text : [jsxc.t('selection_button_description'),
              jsxc.t('selection_button_description_2')],

            when : {
              'before-show' : function() {

                jsxc.newgui.chatSidebarContent.showMainContent();

                setTimeout(function() {
                  $('#jsxc-select-buddies').trigger('click');
                }, 700);
              },

              'show' : function() {
                self._highlightElement('#jsxc-select-buddies');
              }
            },

            beforeShowPromise : self._setAllGuiVisible.bind(self, true)

          },

          {
            attachTo : {element : '#jsxc-chat-sidebar .jsxc-toggle-settings', on : 'top'},

            text : [jsxc.t('settings_description'), jsxc.t('settings_description_2')],

            when : {
              'before-show' : function() {
                $('#jsxc-chat-sidebar .jsxc-toggle-settings').trigger('click');
              },

              'show' : function() {
                self._highlightElement('.jsxc-toggle-settings');
              }

            },

            beforeShowPromise : self._setAllGuiVisible.bind(self, true)

          },

          {
            attachTo : {element : '#jsxc-status-bar', on : 'left'},

            text : [
              jsxc.t('status_panel_description'),
              jsxc.t('status_panel_description_2')],

            beforeShowPromise : self._setAllGuiVisible.bind(self, true),

            when : {
              'show' : function() {
                self._highlightElement('#jsxc-status-bar');
              }
            }

          },

          {

            text : [jsxc.t('end_of_interface_visit')],

            beforeShowPromise : self._setAllGuiVisible.bind(self, true)

          }

        ]
      };

    };

  },

  /**
   * Set side bar visible or not and return a promise which will be resolved when
   * it is done
   * @private
   */
  _setChatSidebarVisible : function(state) {

    var p = new Promise(function(resolve) {
      jsxc.newgui.toggleChatSidebar(state, function() {
        resolve();
      });
    });

    return p;

  },

  /**
   * Set side bar visible or not and return a promise which will be resolved when
   * it is done
   * @private
   */
  _setMediapanelVisible : function(state) {

    var p = new Promise(function(resolve) {
      jsxc.newgui.toggleMediapanel(state, function() {
        resolve();
      });
    });

    return p;

  },

  /**
   * Set side bar visible or not and return a promise which will be resolved when
   * it is done
   * @private
   */
  _clearAllWindows : function() {

    var p = new Promise(function(resolve, reject) {
      jsxc.gui.closeAllChatWindows().then(function() {
        resolve();
      })
          .fail(function() {
            reject();
          });
    });

    return p;

  },

  /**
   * Set all gui visibility and return a promise which will be resolved when finished
   * @param state
   * @returns {*}
   * @private
   */
  _setAllGuiVisible : function(state) {

    var self = jsxc.help;

    var promises = [self._setChatSidebarVisible(state), self._setMediapanelVisible(state)];
    if (!state) {
      promises.push(self._clearAllWindows());
    }

    return Promise.all(promises);

  },

  _highlightElement : function(selector) {

    var jq = $(selector);

    if (jq.length < 1) {
      throw new Error("Invalid selector: " + selector);
    }

    var previous = jq.css('opacity');

    var howManyTimes = 6;

    var i = 0;

    var interval = setInterval(function() {

      if (i > howManyTimes) {
        clearInterval(interval);

        jq.css({
          'opacity' : previous || ''
        });

        return;
      }

      jq.animate({
        'opacity' : i % 2 === 0 ? 0.1 : 1
      }, 400);

      i++;

    }, 500);

  }

};