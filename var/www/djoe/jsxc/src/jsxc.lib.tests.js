/**
 *
 * Unit testing module of JSXC
 *
 *
 * @type {{_showTestBox: jsxc.test._showTestBox}}
 */

jsxc.tests = {

  isTestEnabled : function() {
    return window.location.hostname === "127.0.0.1";
  },

  /**
   * Run tests. Tests run only if we are on localhost to avoid to many long time loading.
   * @param tests
   */
  runTests : function(tests) {

    var self = jsxc.tests;

    // run test only if we are on local host
    if (self.isTestEnabled() !== true) {
      return false;
    }

    $.each(tests, function(index, element) {
      QUnit.test(element.name, element.testCase);
    });

    return true;
  },

  _addTestBox : function() {

    $('body').prepend(
        '<div class="jsxc_testBox"><div id="qunit"></div><div id="qunit-fixture"></div></div>');

  },

  showTestBox : function() {
    $('.jsxc_testBox').css("display", "block");
  }

};

$(function() {

  // Disabled
  // if (jsxc.tests.isTestEnabled() === true) {
  //
  //   jsxc.tests._addTestBox();
  //
  //   jsxc.tests.showTestBox();
  //
  // }

});