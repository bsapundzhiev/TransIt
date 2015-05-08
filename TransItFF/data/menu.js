/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';
/*
*/
(function() {
    var opts = {
        "url": "http://translate.google.com/",
        "srcLang": "auto", 
        "trgLang": "en"
    };
  
    function init(selection) {
        console.log("Menu init...");
    }

    function trFormatURL(data) {
        var options = JSON.parse(data);
        return opts.url + "#" + options.srcLang +"|"+ options.trgLang +"|" + encodeURI(options.text);
    }

    init();

    self.on("click", function(node, data) {
        if(!data) {
            return;
        }

        var url = trFormatURL(data);
        console.log("Url: " + url); 
        self.postMessage(url);
    });

    return {};
}());