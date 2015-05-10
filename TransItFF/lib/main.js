/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

var { data } = require("sdk/self");
var { ToggleButton } = require("sdk/ui");
var selection = require("sdk/selection");
var tabs = require("sdk/tabs");
var contextMenu = require("sdk/context-menu");
//Globals Options, trTab
var options = {"srcLang":"auto","trgLang":"en"};
var currentTab = null;

var updateOpenTab = function(url) {

    if (currentTab) {
        currentTab.url = url;
        currentTab.reload();
        return;
    }

    tabs.open({
        url: url,
        isPinned: false,
        onOpen: function onOpen(tab) {
            currentTab = tab;
        },
        onClose: function onClose(tab) {
            currentTab = null;
        },
        onLoad: function onLoad(tab) {
            tab.activate();
        }
    });
};

var trItem = contextMenu.Item({
    data: null,
    //context: contextMenu.SelectionContext(),
    label: "Translate...",
    image: data.url("icon.gif"),
    contentScriptFile: data.url("menu.js"),
    onMessage: updateOpenTab
});

selection.on('select', function() {
    options.text = selection.text;
    trItem.data = JSON.stringify(options);
    var text = selection.text;
    if (text.length > 20) {
        text = text.substr(0, 20) + "...";  
    }
    
    trItem.label = "Translate '" + text + "'" 
        + "("+options.srcLang+"-"+options.trgLang+")";
});

var panelTransIt = require("sdk/panel").Panel({
    width: 240,
    height: 130,
    contentURL: data.url("options.html"),
    contentScriptFile: [
        data.url("languages.js"),
        data.url("options.js")
    ],
    onHide: handleHide
});

panelTransIt.on("message", function(msg) {
    console.log(JSON.stringify(msg));
    options = msg;
});

let button = ToggleButton({
    id: "open-transit-btn",
    label: "TransIt",
    icon: data.url("icon.gif"),
    onChange: handleChange
});

exports.main = function(options, callbacks) {
    // If you run cfx with --static-args='{"quitWhenDone":true}' this program
    // will automatically quit Firefox when it's done.
    if (options.staticArgs.quitWhenDone)
        callbacks.quit();
};

function handleChange(state) {
    if (state.checked) {
        panelTransIt.show({ position: button });
    }   
}

function handleHide() {
    button.state('window', { checked: false });
}
