/**
 * REST operations
 *
 *
 */
jsxc.rest = {

    init: function () {

        var self = jsxc.rest;

        // initialising openfire
        self.openfire.apiBaseUrl = jsxc.options.get('rest').apiBaseUrl || "";
        self.openfire.apiKey = jsxc.options.get('rest').apiKey || "";

    },

    openfire: {

        /**
         * URL for accessing REST API
         */
        apiBaseUrl: "",

        /**
         * Auth key
         */
        apiKey: "",

        /**
         * Check if all parameters needed to use API are presents
         * @returns {boolean}
         * @private
         */
        _checkAvailability: function () {

            var self = jsxc.rest.openfire;

            if (self.apiBaseUrl === "") {
                jsxc.warn("Rest api not available: no base url found");
                return false;
            }
            if (self.apiKey === "") {
                jsxc.warn("Rest api not available: no api key found");
                return false;
            }

            return true;
        },

        /**
         * Create an user and return a JQuery promise.
         *
         * User login will be in lower case.
         *
         * Errors:
         * 409: user exist
         * 500: invalid username
         *
         * @param userJid
         * @returns {*}
         */
        createUser: function (userNode) {

            var self = jsxc.rest.openfire;
            if (self._checkAvailability() !== true) {

                var falsePromise = $.Deferred().promise();
                falsePromise.fail("Openfire REST API unavailable");

                return falsePromise;
            }

            return self._asyncRequest(
                'POST',
                "/users",
                {
                    username: userNode.toLowerCase(),
                    password: "azerty",
                }
            );

        },

        /**
         *
         * Utils to do async REST requests
         *
         *
         */
        _asyncRequest: function (type, url, data, headers) {

            var self = jsxc.rest.openfire;

            if (typeof type === "undefined") {
                throw "Parameter cannot be undefined: " + type;
            }
            if (typeof url === "undefined") {
                throw "Parameter cannot be undefined: " + url;
            }

            var restUrl = self.apiBaseUrl + url;

            var req = {
                url: restUrl,
                type: type,
                dataType: "json",
                headers: {
                    "Authorization": self.apiKey,
                    "Content-Type": "application/json"
                }
            };

            // ajouter des données si necessaire
            if (typeof data !== "undefined") {
                req.data = JSON.stringify(data);
            }

            // ajouter entetes si necessaire
            if (typeof headers !== "undefined") {
                $.extend(req.headers, headers);
            }

            return $.ajax(req);

        },

    }

};
