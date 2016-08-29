/**
 *
 * Small utility used to test if a bosh connexion is well configurated
 *
 *
 */
$(function() {

  BOSHTester.init();

});

var BOSHTester = {

  /**
   * Default settings
   */
  settings : {
    xmpp : {

      url : '/http-bind/',

      domain : 'localhost',

      resource : 'example',

      overwrite : true

    }
  },

  /**
   * Show a message
   * @param message
   */
  feedback : function(message) {
    var d = new Date();
    var formatted = d.getUTCHours() + ":" + d.getUTCMinutes() + ":" + d.getUTCSeconds();
    $('#feedback_area').append('<p>' + formatted + ': ' + message + '</p>');
  },

  /**
   * Init the BOSH tester
   */
  init : function() {

    var self = BOSHTester;

    $('#launch-test').click(self.testFromForm);

  },

  testFromForm : function() {

    var self = BOSHTester;

    self.feedback('Checking BOSH connexion ...');

    if (window.timeout) {
      clearTimeout(window.timeout);
    }

    var url = $('#bosh-url').val();
    var domain = $('#xmpp-domain').val();

    if (!url || !domain) {
      self.feedback('We need a domain and an URL resource. domain: ' + domain + ' / url: ' + url);
      return;
    }

    self.settings.xmpp.url = url;
    self.settings.xmpp.domain = domain;

    self.testBoshServer(url, domain);

  },

  /**
   * Test if bosh server is up and running.
   *
   * @param  {string}   url    BOSH url
   * @param  {string}   domain host domain for BOSH server
   * @param  {Function} cb     called if test is done
   */
  testBoshServer : function(url, domain) {

    var self = BOSHTester;

    var rid = '123456';

    // make AJAX request to bosh server
    $.ajax({
      type : 'POST',
      url : url,
      data : "<body rid='" + rid + "' xmlns='http://jabber.org/protocol/httpbind' to='" + domain +
      "' xml:lang='en' wait='60' hold='1' content='text/xml; charset=utf-8' ver='1.6' xmpp:version='1.0' xmlns:xmpp='urn:xmpp:xbosh'/>",
      global : false,
      dataType : 'xml'
    })

        .done(function(stanza) {

          console.log('Response from server: ', {stanza : stanza});

          if (typeof stanza === 'string') {
            // shouldn't be needed anymore, because of dataType
            stanza = $.parseXML(stanza);
          }

          var body = $(stanza).find('body[xmlns="http://jabber.org/protocol/httpbind"]');
          var condition = (body) ? body.attr('condition') : null;
          var type = (body) ? body.attr('type') : null;

          // we got a valid xml response, but we have test for errors
          if (body.length > 0 && type !== 'terminate') {
            self.feedback('BOSH Server reachable.');
          }

          else {

            if (condition === 'internal-server-error') {
              self.feedback('Internal server error: ' + body.text());
            }

            else if (condition === 'host-unknown') {
              if (url) {
                self.feedback('Host unknown: ' + domain + ' is unknown to your XMPP server.');
              } else {
                self.feedback('Host unknown: Please provide a XMPP domain.');
              }
            }

            else {
              self.feedback('Fail: ' + condition);
            }
          }
        })

        // fail while requesting
        .fail(function(xhr, textStatus) {

          console.error('Response from server: ', {xhr : xhr, textStatus : textStatus});

          var fullurl;
          if (url.match(/^https?:\/\//)) {
            fullurl = url;
          } else {
            fullurl = window.location.protocol + '//' + window.location.host;
            if (url.match(/^\//)) {
              fullurl += url;
            } else {
              fullurl += window.location.pathname.replace(/[^/]+$/, "") + url;
            }
          }

          if (xhr.status === 0) {
            // cross-side
            self.feedback(
                'Cross domain request was not possible. Either your BOSH server does not send any ' +
                'Access-Control-Allow-Origin header or the content-security-policy (CSP) blocks your request. ' +
                'Starting from Owncloud 9.0 your CSP will be updated in any app which uses the appframework (e.g. files) ' +
                'after you save these settings and reload.' +
                'The savest way is still to use Apache ProxyRequest or Nginx proxy_pass.');
          }

          else if (xhr.status === 404) {
            // not found
            self.feedback(
                'Your server responded with "404 Not Found". Please check if your BOSH server is running and reachable via ' +
                fullurl + '.');
          }

          else if (textStatus === 'parsererror') {
            self.feedback('Invalid XML received. Maybe ' + fullurl +
                ' was redirected. You should use an absolute url.');
          }

          else {
            self.feedback('Fail: ' + xhr.status + ' ' + xhr.statusText);
          }
        });
  }

};
