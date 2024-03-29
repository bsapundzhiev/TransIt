//Google translate automation for chrome. 
//Author:(C) 2012 Borislav Sapundzhiev
//License: This file is released under the terms of GPL v2.

function TabTrView(translators) {

    this.menuid = 0;
    this.tabsInfo = {};
    this.translators = translators;
    this.opts = translators[0];
    this.opts.load(this.settingChanged.bind(this));
}

TabTrView.prototype.createContextMenu = function (onclickEv) {

    var title = this.opts.getMenuTitle();
    
    if (!this.menuid) {
        console.log("createContextMenu: ", this.menuid);
        chrome.contextMenus.removeAll();
    }
    
    this.menuid = chrome.contextMenus.create({
        "id": "transit-tr-command",
        "title": title, 
        "contexts": ["selection"]
    });
    
    chrome.contextMenus.onClicked.addListener(onclickEv);
}

TabTrView.prototype.addRemoveTabListener = function (removeEv) {

    chrome.tabs.onRemoved.addListener(removeEv);
}

TabTrView.prototype.addOnMessageListener = function(notifyEv) {

    chrome.runtime.onMessage.addListener(notifyEv);
}

TabTrView.prototype.settingChanged = function(message) {

    const newTranslator = this.translators.find(
        (translator) => (translator.opts.name == message.translator));
    
    if (newTranslator && this.opts != newTranslator) {
        this.opts = newTranslator;
    }

    this.opts.setSettings(message);
    if (this.menuid) {
        var title = this.opts.getMenuTitle();
        chrome.contextMenus.update(this.menuid, {"title": title});
    }
}

TabTrView.prototype.addTabId = function (Tab) {
    
    this.tabsInfo[Tab.windowId] = Tab.id;  
}

TabTrView.prototype.remTabId = function (TabId, removeInfo) {
    
    if (this.tabsInfo[removeInfo.windowId] == TabId) {
        delete this.tabsInfo[removeInfo.windowId];
    }
}

TabTrView.prototype.createTab = async function (textToTranslate, createEv, fromTab) {

    var windowId = await this.GetCurrentWindowId(fromTab);
    var tabId = this.tabsInfo[windowId];
    var url = this.opts.trFormatURL(textToTranslate);

    if (!tabId || this.opts.getOpenNewTab()) {
        chrome.tabs.create( {"url": url }, createEv );
    } else {
        chrome.tabs.update( tabId, {"active": true, "url": url } );
    }
}

TabTrView.prototype.GetCurrentWindowId = function(fromTab) {

    var result = Promise.resolve(fromTab.windowId);

    if (fromTab.windowId == chrome.windows.WINDOW_ID_NONE) {
        result = new Promise((resolve, reject) => {
            chrome.windows.getCurrent(function(win) {
                resolve(win.id);
            });
        });
    } 
    return result;
}

function TabTrCtrl(view) {

    this.view_ = view;  
}

TabTrCtrl.prototype.trInitListeners = function() {

    this.view_.createContextMenu(this.trMenuEv.bind(this)); 
    this.view_.addRemoveTabListener(this.trTabRemEv.bind(this));
    this.view_.addOnMessageListener(this.trMessageEv.bind(this));
}

TabTrCtrl.prototype.trTabAddEv = function(Tab) {
    
    this.view_.addTabId(Tab);
}

TabTrCtrl.prototype.trTabRemEv = function(TabId, removeInfo) {

    this.view_.remTabId(TabId, removeInfo);
}

TabTrCtrl.prototype.trMessageEv = function(message, sender, sendResponse) {
    this.view_.settingChanged(message);
    sendResponse({});
}

TabTrCtrl.prototype.trMenuEv = function(OnClickData, Tab) {
    
    var textToTranslate = OnClickData.selectionText;
    this.view_.createTab(textToTranslate, this.trTabAddEv.bind(this), Tab); 
}

function TrSettings(opts) {
    this.opts = opts;
    this.opts.settings = {};
}

TrSettings.prototype.setSettings = function(settings) {
   if (settings) {
      this.opts.settings = settings;   
   }
}

TrSettings.prototype.getSrcLang = function() {
    return this.opts.settings.srcLang;
}

TrSettings.prototype.getTrgLang = function() {
    return  this.opts.settings.trgLang
}

TrSettings.prototype.getOpenNewTab = function() {
    return this.opts.settings.openNewTab;
}

TrSettings.prototype.trFormatURL = function(text) {
    const trUrl = this.opts.search ? 
        this.trFormatSearchURL(text) : this.trFormatTranslationURL(text) 
    return trUrl;
}

TrSettings.prototype.trFormatTranslationURL = function(text) {

    var encodedText = encodeURIComponent(text);
    var separator = this.opts.separator;
    var trUrl = `${this.opts.url}#${this.getSrcLang()}${separator}${this.getTrgLang()}${separator}${encodedText}`;
    return trUrl;
}

TrSettings.prototype.trFormatSearchURL = function(text) {

    var encodedText = encodeURIComponent(text);
    var srUrl = this.opts.url.replace("%s", encodedText);
    return srUrl;
}

TrSettings.prototype.getMenuTitle = function() {
    const menuTitle = this.opts.search ? 
        this.getSearchMenuTitle() : this.getTranslationMenuTitle();
    return menuTitle;
}

TrSettings.prototype.getTranslationMenuTitle = function() {

    var srcLang = TransIt.GetLangName(this.getSrcLang());
    var trgLang = TransIt.GetLangName(this.getTrgLang());
    
    const menuTitle = 
        `(${this.opts.name})[${srcLang}⇨${trgLang}]${this.opts.menuTitle}`;
    return menuTitle;
}

TrSettings.prototype.getSearchMenuTitle = function() {
    const menuTitle = 
        `Search ${this.opts.name}${this.opts.menuTitle}`;
    return menuTitle;
}

TrSettings.prototype.load = function(callback)
{
   if (callback) {
      var settingsPromises = [
        TransIt.localStore.get("Transit.srcLang", "en"), 
        TransIt.localStore.get("Transit.trgLang", "en"),
        TransIt.localStore.get("Transit.openNewTab", false),
        TransIt.localStore.get("Transit.translator", this.opts.name)
      ];
      Promise.all(settingsPromises).then( values => { 
        callback({srcLang: values[0], trgLang: values[1], openNewTab: values[2], translator: values[3]});
      });
   }
}

importScripts("localstore.js");
importScripts("languages.js");

(function() {
    console.log("Init TransIt...");
    
    const translators = [
        new TrSettings({
            name: "Google",
            url: "https://translate.google.com/",
            separator: "|",
            menuTitle: ": '%s'",
        }), 
        new TrSettings({
            name: "Deepl",   
            url: "https://www.deepl.com/translator",
            separator: "/",
            menuTitle: ": '%s'",
        }),
        new TrSettings({
            //https://en.wikipedia.org/wiki/Help:Searching_from_a_web_browser
            name: "Wikipedia",
            search: true,
            url:"https://en.wikipedia.org/w/index.php?title=Special:Search&search=%s",
            menuTitle: ": '%s'",
        })
    ];
    
    var trView = new TabTrView(translators);
    var trCtr = new TabTrCtrl(trView);

    trCtr.trInitListeners();
})();
