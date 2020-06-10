/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';
(function() {

    var exports = {};

    var storeSave = function (ComboId, StoreId) {
      var select = document.getElementById(ComboId);
      var srcLang = select.children[select.selectedIndex].value;
      localStorage[StoreId] = srcLang;
    };

    var storeRestore = function(ComboId, StoreId) {
      var favorite = localStorage[StoreId];
      if (!favorite) {
        return;
      }
      var select = document.getElementById(ComboId);
      for (var i = 0; i < select.children.length; i++) {
        var child = select.children[i];
        if (child.value == favorite) {
          child.selected = "true";
          break;
        }
      }
    };

    var populateLang = function(ComboId) {

        var combo = document.getElementById(ComboId);
        for(var k in TransIt.languages) {
            var v = TransIt.languages[k];
            combo.add( new Option (k, v), null );
        }
    };

    var saveOptions = function() {
        console.log("Save ...");
        storeSave("srcLang", "Transit.srcLang");
        storeSave("trgLang", "Transit.trgLang");
        notify();
    }

    var restoreOptions = function() {
         populateLang("srcLang");
         populateLang("trgLang");
         storeRestore("srcLang", "Transit.srcLang");
         storeRestore("trgLang", "Transit.trgLang");
        notify();
    }

    function init() {
        restoreOptions();
        document.getElementById("srcLang").addEventListener("change", saveOptions, false);
        document.getElementById("trgLang").addEventListener("change", saveOptions, false);
        console.log("Options loaded...");
    }

    function notify() {
       var message = {
        "srcLang":localStorage["Transit.srcLang"] || "auto",
        "trgLang":localStorage["Transit.trgLang"] || "ar"
       };
       self.postMessage(message);
    }

    window.onload = function() {
        init();
    };

    return exports;

}());
