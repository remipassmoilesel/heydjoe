/**
 * Utils to inspect XMPP exchanges through StropheJS
 *
 * Only work with StropheJS and BOSH transport for now.
 *
 * Prettify code from "XMPP professionnal programming"
 *
 * @type {{}}
 */
(function($) {

  $.fn.xmppInspector = function(stropheConnexion) {

    // empty element first
    $(this).empty();

    // styling
    $(this).css({
      'height' : '200px',
    });

    // make resizable
    $(this).resizable();

    var title = $("<div>XMPP Inspector: </div>")
        .css({
          'font-weight' : 'bolder', 'margin' : "10px"
        });

    $(this).append(title);

    $(this).append("<div class='console'><div/>");

    var logSpace = $(this).find(".console");
    logSpace.css({
      'overflow' : 'scroll', 'background' : 'black', 'height' : '90%', 'padding' : '15px'
    });

    // intercept XML
    stropheConnexion.xmlInput = function(body) {
      show_traffic(body, 'incoming');
    };

    stropheConnexion.xmlOutput = function(body) {
      show_traffic(body, 'outgoing');
    };

    // show traffic
    var show_traffic = function(body, type) {

      var title = "<h1 class='xmppinspector_title'>" + type + " " + new Date().toUTCString() +
          "</h1>";

      type = "xmppinspector_" + type;

      if (body.childNodes.length > 0) {

        $.each(body.childNodes, function() {

          logSpace.append(title);

          logSpace.append(
              "<div class='xmppinspector_traffic " + type + "'>" + pretty_xml(this) + "</div>");
        });

        // scroll down

        var height = logSpace[0].scrollHeight;
        logSpace.scrollTop(height);

      }
    };

    var pretty_xml = function(xml, level) {
      var i, j;
      var result = [];
      if (!level) {
        level = 0;
      }

      result.push("<div class='xml_level" + level + "'>");
      result.push("<span class='xml_punc'>&lt;</span>");
      result.push("<span class='xml_tag'>");
      result.push(xml.tagName);
      result.push("</span>");

      // attributes
      var attrs = xml.attributes;
      var attr_lead = []
      for (i = 0; i < xml.tagName.length + 1; i++) {
        attr_lead.push("&nbsp;");
      }
      attr_lead = attr_lead.join("");

      for (i = 0; i < attrs.length; i++) {
        result.push(" <span class='xml_aname'>");
        result.push(attrs[i].nodeName);
        result.push("</span><span class='xml_punc'>='</span>");
        result.push("<span class='xml_avalue'>");
        result.push(attrs[i].nodeValue);
        result.push("</span><span class='xml_punc'>'</span>");

        if (i !== attrs.length - 1) {
          result.push("</div><div class='xml_level" + level + "'>");
          result.push(attr_lead);
        }
      }

      if (xml.childNodes.length === 0) {
        result.push("<span class='xml_punc'>/&gt;</span></div>");
      } else {
        result.push("<span class='xml_punc'>&gt;</span></div>");

        // children
        $.each(xml.childNodes, function() {
          if (this.nodeType === 1) {
            result.push(pretty_xml(this, level + 1));
          } else if (this.nodeType === 3) {
            result.push("<div class='xml_text xml_level" + (level + 1) + "'>");
            result.push(this.nodeValue);
            result.push("</div>");
          }
        });

        result.push("<div class='xml xml_level" + level + "'>");
        result.push("<span class='xml_punc'>&lt;/</span>");
        result.push("<span class='xml_tag'>");
        result.push(xml.tagName);
        result.push("</span>");
        result.push("<span class='xml_punc'>&gt;</span></div>");
      }

      return result.join("");
    };

    var text_to_xml = function(text) {
      var doc = null;
      if (window['DOMParser']) {
        var parser = new DOMParser();
        doc = parser.parseFromString(text, 'text/xml');
      } else if (window['ActiveXObject']) {
        var doc = new ActiveXObject("MSXML2.DOMDocument");
        doc.async = false;
        doc.loadXML(text);
      } else {
        throw {
          type : 'PeekError', message : 'No DOMParser object found.'
        };
      }

      var elem = doc.documentElement;
      if ($(elem).filter('parsererror').length > 0) {
        return null;
      }
      return elem;
    }

    return this;

  };

}(jQuery));