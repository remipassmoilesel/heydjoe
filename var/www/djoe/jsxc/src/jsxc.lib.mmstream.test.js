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

      var remi = "remi@im.silverpeas.net/eeee";
      var david = "david@im.silverpeas.net/eeee";
      var yohann = "yohann@im.silverpeas.net/eeee";

      var participants = [david, yohann];

      var computed1 = {

        remi : jsxc.mmstream._whichUsersMustWeCall(remi, participants, remi),

        david : jsxc.mmstream._whichUsersMustWeCall(remi, participants, david),

        yohann : jsxc.mmstream._whichUsersMustWeCall(remi, participants, yohann)
      };

      var result1 = {
        "remi" : ["yohann@im.silverpeas.net/eeee", "david@im.silverpeas.net/eeee"],

        "david" : [],

        "yohann" : ["david@im.silverpeas.net/eeee"]
      };

      //console.log(expected1);

      assert.ok(JSON.stringify(computed1) === JSON.stringify(result1),
          "Destinations selection ok (demo)");

      /**
       * Complete test case
       *
       */

      var domain = "@domain.net";

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
        "a@domain.net" : ["b@domain.net", "c@domain.net", "d@domain.net"],
        "b@domain.net" : ["c@domain.net", "d@domain.net"],
        "c@domain.net" : ["d@domain.net"],
        "d@domain.net" : [],
        "f@domain.net" : ["g@domain.net", "h@domain.net", "i@domain.net", "a@domain.net",
          "b@domain.net", "c@domain.net", "d@domain.net"],
        "g@domain.net" : ["h@domain.net", "i@domain.net", "a@domain.net", "b@domain.net",
          "c@domain.net", "d@domain.net"],
        "h@domain.net" : ["i@domain.net", "a@domain.net", "b@domain.net", "c@domain.net",
          "d@domain.net"],
        "i@domain.net" : ["a@domain.net", "b@domain.net", "c@domain.net", "d@domain.net"],
        "e@domain.net" : ["f@domain.net", "g@domain.net", "h@domain.net", "i@domain.net",
          "a@domain.net", "b@domain.net", "c@domain.net", "d@domain.net"]
      };

      assert.ok(JSON.stringify(computed2) === JSON.stringify(expected2),
          "Destinations selection ok (complete)");

    }
  },

  {
    name : "Utility methods for videoconference",

    testCase : function(assert) {

      var self = jsxc.mmstream;

      var user = "a@domain.net/heyhey";

      self._setUserStatus(user, self.USER_STATUS.READY);
      assert.ok(self._isBuddyReady(user) === true, "READY ok");
      assert.ok(self._isBuddyParticipatingToVideoconference(user) === true, "Participating ok");

      // delte user after, to not alter JSXC service
      delete self.videoconference.users[user];

    }
  }

];

$(function() {

});





































