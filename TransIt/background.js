//Google translate automation for chrome. 
//Author:(C) 2012 Borislav Sapundzhiev
//License: This file is released under the terms of GPL v2.

function TabTrView(opts) {

    this.menuid = 0;
    this.tabsInfo = {};
    this.opts = opts;
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

    var windowId = fromTab.windowId;
    if (fromTab.windowId == chrome.windows.WINDOW_ID_NONE) {
        windowId = await this.GetCurrentWindowId();
    }
    
    var tabId = this.tabsInfo[windowId];
    var url = this.opts.trFormatURL(textToTranslate);

    if (!tabId) {
        chrome.tabs.create( {"url": url }, createEv );
    } else {
        chrome.tabs.update( tabId, {"active": true, "url": url } );
    }
}

TabTrView.prototype.GetCurrentWindowId = function() {
    
    return new Promise((resolve, reject) => {
        chrome.windows.getCurrent(function(win) {
            resolve(win.id);
        });
    });
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
    return this.opts.settings.srcLang || this.opts.srcLang;
}

TrSettings.prototype.getTrgLang = function() {
    return  this.opts.settings.trgLang || this.opts.trgLang;
}

TrSettings.prototype.trFormatURL = function(text) {

    var encodedText = encodeURIComponent(text);
    const urlEelements = [
        this.opts.url, "#", this.getSrcLang(), "|", this.getTrgLang(), "|", encodeURI(encodedText)
    ];
    return urlEelements.join('');
}

TrSettings.prototype.getMenuTitle = function() {

    var srcLang = TransIt.GetLangName(this.getSrcLang());
    var trgLang = TransIt.GetLangName(this.getTrgLang());
    const menuTitleElements = [
        "[", srcLang, "⇨", trgLang, "]", this.opts.menuTitle
    ];
    return menuTitleElements.join('');
}

TrSettings.prototype.load = function(callback)
{
   if(callback) {
      var srcPromise = TransIt.localStore.get("Transit.srcLang", "auto");
      var trgPromise = TransIt.localStore.get("Transit.trgLang", "en");
      Promise.all([srcPromise, trgPromise]).then( values => { 
        callback({srcLang: values[0], trgLang: values[1]});
      });
   }
}

importScripts("localstore.js");
importScripts("languages.js");

(function() {
    console.log("Init TransIt...");
    var trSettings = new TrSettings({
       url: "https://translate.google.com/",
       menuTitle: ": '%s'",
    });

    var trView = new TabTrView(trSettings);
    var trCtr = new TabTrCtrl(trView);

    trCtr.trInitListeners();
})();
