/**
 * Test cases of multiple multimedia stream module
 *
 *
 * /!\ Be careful, here you can manipulate real data of JSXC client
 *
 * @type {{}}
 */

jsxc.mmstream.testCases = [

  {
    name : "Video participants selection",

    testCase : function(assert) {

      var self = jsxc.mmstream;

      /**
       * Example test case
       *
       */

      var remi = "remi@heydjoe.xmpp/eeee";
      var david = "david@heydjoe.xmpp/eeee";
      var yohann = "yohann@heydjoe.xmpp/eeee";

      var participants = [david, yohann];

      var computed1 = {

        remi : jsxc.mmstream._whichUsersMustWeCall(remi, participants, remi),

        david : jsxc.mmstream._whichUsersMustWeCall(remi, participants, david),

        yohann : jsxc.mmstream._whichUsersMustWeCall(remi, participants, yohann)
      };

      var result1 = {
        "remi" : ["yohann@heydjoe.xmpp/eeee", "david@heydjoe.xmpp/eeee"],

        "david" : [],

        "yohann" : ["david@heydjoe.xmpp/eeee"]
      };

      //console.log(expected1);

      assert.ok(JSON.stringify(computed1) === JSON.stringify(result1),
          "Destinations selection ok (demo)");

      /**
       * Complete test case
       *
       */

      var domain = "@domain.xmpp";

      var nodes = ['a', 'b', 'c', 'd', 'f', 'g', 'h', 'i'];

      participants = [];

      var initiator = "e" + domain;

      // create a fake list of participants
      $.each(nodes, function(index, node) {
        participants.push(node + domain);
      });

      var computed2 = {};

      $.each(participants.concat([initiator]), function(index, part) {
        computed2[part] = self._whichUsersMustWeCall(initiator, participants, part);
      });

      var expected2 = {
        "a@domain.xmpp" : ["b@domain.xmpp", "c@domain.xmpp", "d@domain.xmpp"],
        "b@domain.xmpp" : ["c@domain.xmpp", "d@domain.xmpp"],
        "c@domain.xmpp" : ["d@domain.xmpp"],
        "d@domain.xmpp" : [],
        "f@domain.xmpp" : ["g@domain.xmpp", "h@domain.xmpp", "i@domain.xmpp", "a@domain.xmpp",
          "b@domain.xmpp", "c@domain.xmpp", "d@domain.xmpp"],
        "g@domain.xmpp" : ["h@domain.xmpp", "i@domain.xmpp", "a@domain.xmpp", "b@domain.xmpp",
          "c@domain.xmpp", "d@domain.xmpp"],
        "h@domain.xmpp" : ["i@domain.xmpp", "a@domain.xmpp", "b@domain.xmpp", "c@domain.xmpp",
          "d@domain.xmpp"],
        "i@domain.xmpp" : ["a@domain.xmpp", "b@domain.xmpp", "c@domain.xmpp", "d@domain.xmpp"],
        "e@domain.xmpp" : ["f@domain.xmpp", "g@domain.xmpp", "h@domain.xmpp", "i@domain.xmpp",
          "a@domain.xmpp", "b@domain.xmpp", "c@domain.xmpp", "d@domain.xmpp"]
      };

      assert.ok(JSON.stringify(computed2) === JSON.stringify(expected2),
          "Destinations selection (complete)");

    }
  },

  {
    name : "Utility methods for videoconference",

    testCase : function(assert) {

      var self = jsxc.mmstream;

      var user = "a@domain.xmpp/heyhey";

      self._setUserStatus(user, self.USER_STATUS.READY);
      assert.ok(self._isBuddyReady(user) === true, "test status = READY");

      self._setUserType(user, self.USER_TYPE.VIDEOCONF_INITIATOR);
      assert.ok(self._isBuddyParticipatingToVideoconference(user) === true,
          " test status = PARTICIPATING 1");

      self._setUserType(user, self.USER_TYPE.VIDEOCONF_PARTICIPANT);
      assert.ok(self._isBuddyParticipatingToVideoconference(user) === true,
          " test status = PARTICIPATING 2");

      self._setUserStatus(user, self.USER_STATUS.REJECTED);
      assert.ok(self._isBuddyParticipatingToVideoconference(user) !== true,
          " test status = PARTICIPATING 3");

      // delte user after, to not alter JSXC service
      delete self.multimediacache.users[user];

    }
  }

];

$(function() {

});





































