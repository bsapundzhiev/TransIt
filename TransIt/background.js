//Google translate automation for chrome. 
//Author:(C) 2012 Borislav Sapundzhiev
//License: This file is released under the terms of GPL v2.

function TabTrView(opts) {

    this.menuid = 0;
    this.tabsInfo = {};
    this.opts = opts;
}

TabTrView.prototype.createContextMenu = function (onclickEv) {

    var title = this.opts.getMenuTitle();

    this.menuid = chrome.contextMenus.create({
        "title": title, 
        "contexts": ["selection"],
        "onclick": onclickEv
    });
}

TabTrView.prototype.addRemoveTabListener = function (removeEv) {

    chrome.tabs.onRemoved.addListener(removeEv);
}

TabTrView.prototype.addOnMessageListener = function(notifyEv) {

    chrome.runtime.onMessage.addListener(notifyEv);
}

TabTrView.prototype.settingChanged = function(message) {

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

TabTrView.prototype.createTab = function (textToTranslate, createEv, fromTab) {

    var tabId = this.tabsInfo[fromTab.windowId];
    var url = this.opts.trFormatURL(textToTranslate);

    if(!tabId) {
        chrome.tabs.create( {"url": url }, createEv );
    } else {
        chrome.tabs.update( tabId, {"active": true, "url": url } );
    }
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

TabTrCtrl.prototype.trMessageEv = function(message) {

    this.view_.settingChanged(message);
}

TabTrCtrl.prototype.trMenuEv = function(OnClickData, Tab) {
    
    var textToTranslate = OnClickData.selectionText || "No selected text";

    this.view_.createTab(textToTranslate, this.trTabAddEv.bind(this), Tab); 
}

function TrSettings(opts) {
    this.opts = opts;
}

TrSettings.prototype.getSrcLang = function() {
            
    return localStorage[this.opts.srcLangKey] || this.opts.srcLang;
}

TrSettings.prototype.getTrgLang = function() {

    return localStorage[this.opts.trgLangKey] || this.opts.trgLang;
}

TrSettings.prototype.trFormatURL = function(text) {

    const urlEelements = [
        this.opts.url, this.opts.separators[0], 
        this.getSrcLang(), this.opts.separators[1],
        this.getTrgLang(), this.opts.separators[1], 
        window.encodeURI(text)
    ];
    return urlEelements.join('');
}

TrSettings.prototype.getMenuTitle = function() {

    const menuTitleElements = [
        this.opts.separators[2], this.getSrcLang(), 
        this.opts.separators[1], this.getTrgLang(),  
        this.opts.separators[3], this.opts.menuTitle
    ];
    return menuTitleElements.join('');
}

document.addEventListener('DOMContentLoaded', function () {

    try {

        var trSettings = new TrSettings({
            url: "http://translate.google.com/",
            srcLang: "auto", 
            trgLang: "en",
            srcLangKey: "Transit.srcLang",
            trgLangKey: "Transit.trgLang",
            separators: ["#","|","[","]"],
            menuTitle: " Translate '%s'",
        });

        var trView = new TabTrView(trSettings);
        var trCtr = new TabTrCtrl(trView);
        
        trCtr.trInitListeners();
        
    } catch (e) {
        alert("Transit error: " + e);
    }
});
