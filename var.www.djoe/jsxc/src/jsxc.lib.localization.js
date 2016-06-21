jsxc.localization = {

    init: function () {

        // detect language
        var lang;
        if (jsxc.storage.getItem('lang') !== null) {
            lang = jsxc.storage.getItem('lang');
        } else if (jsxc.options.autoLang && navigator.language) {
            lang = navigator.language.substr(0, 2);
        } else {
            lang = jsxc.options.defaultLang;
        }

        /**
         *
         *
         *
         *
         *
         *
         *
         *
         */

        /* jshint ignore:start */

        /**
         *
         *
         *
         *
         *
         *
         *
         *
         */

        // import i18n relative to tmp/. Import only amd module, not jquery.
        jsxc.i18n = require("../lib/i18next/i18next.amd.js");

        // shortcut
        jsxc.t = jsxc.i18n.translate;

        // initialize i18n translator
        jsxc.i18n.init({
            lng: lang,
            fallbackLng: 'en',
            resStore: chatclient_I18next_ressource_store,
            // use localStorage and set expiration to a day
            useLocalStorage: true,
            localStorageExpirationTime: 60 * 60 * 24 * 1000,
            debug: jsxc.storage.getItem('debug') === true
        });

        /**
         *
         *
         *
         *
         *
         *
         *
         *
         */

        /* jshint ignore:end */

        /**
         *
         *
         *
         *
         *
         *
         *
         *
         */
    },

    processHtmlString: function (str, options) {

        var o = jsxc.i18n.options;

        return $(str).each(function () {

            // localize element itself
            jsxc.localization._localize($(this), options);

            // localize childs
            var elements = $(this).find('[' + o.selectorAttr + ']');
            elements.each(function () {
                jsxc.localization._localize($(this), options);
            });

        });

        // return jsxc.i18n.translate($(str));

        //
        // return this.each(function () {
        //     // localize element itself
        //     jsxc.i18n.localize($(this), options);
        //
        //     // localize childs
        //     var elements = $(this).find('[' + o.selectorAttr + ']');
        //     elements.each(function () {
        //         jsxc.i18n.localize($(this), options);
        //     });
        // });

    },

    _parse: function (ele, key, options) {

        var o = jsxc.i18n.options;

        if (key.length === 0) {
            return;
        }

        var attr = 'text';

        if (key.indexOf('[') === 0) {
            var parts = key.split(']');
            key = parts[1];
            attr = parts[0].substr(1, parts[0].length - 1);
        }

        if (key.indexOf(';') === key.length - 1) {
            key = key.substr(0, key.length - 2);
        }

        var optionsToUse;
        if (attr === 'html') {
            optionsToUse = o.defaultValueFromContent ? $.extend({defaultValue: ele.html()}, options) : options;
            ele.html(jsxc.t(key, optionsToUse));
        } else if (attr === 'text') {
            optionsToUse = o.defaultValueFromContent ? $.extend({defaultValue: ele.text()}, options) : options;
            ele.text(jsxc.t(key, optionsToUse));
        } else if (attr === 'prepend') {
            optionsToUse = o.defaultValueFromContent ? $.extend({defaultValue: ele.html()}, options) : options;
            ele.prepend(jsxc.t(key, optionsToUse));
        } else if (attr === 'append') {
            optionsToUse = o.defaultValueFromContent ? $.extend({defaultValue: ele.html()}, options) : options;
            ele.append(jsxc.t(key, optionsToUse));
        } else if (attr.indexOf("data-") === 0) {
            var dataAttr = attr.substr(("data-").length);
            optionsToUse = o.defaultValueFromContent ? $.extend({defaultValue: ele.data(dataAttr)}, options) : options;
            var translated = jsxc.t(key, optionsToUse);
            //we change into the data cache
            ele.data(dataAttr, translated);
            //we change into the dom
            ele.attr(attr, translated);
        } else {
            optionsToUse = o.defaultValueFromContent ? $.extend({defaultValue: ele.attr(attr)}, options) : options;
            ele.attr(attr, jsxc.t(key, optionsToUse));
        }
    },


    _localize: function (ele, options) {

        var o = jsxc.i18n.options;

        var key = ele.attr(o.selectorAttr);
        if (!key && typeof key !== 'undefined' && key !== false) {
            key = ele.text() || ele.val();
        }
        if (!key) {
            return;
        }

        var target = ele
            , targetSelector = ele.data("i18n-target");
        if (targetSelector) {
            target = ele.find(targetSelector) || ele;
        }

        if (!options && o.useDataAttrOptions === true) {
            options = ele.data("i18n-options");
        }
        options = options || {};

        if (key.indexOf(';') >= 0) {
            var keys = key.split(';');

            $.each(keys, function (m, k) {
                if (k !== '') {
                    jsxc.localization._parse(target, k, options);
                }
            });

        } else {
            jsxc.localization._parse(target, key, options);
        }

        if (o.useDataAttrOptions === true) {
            ele.data("i18n-options", options);
        }
    }
};
