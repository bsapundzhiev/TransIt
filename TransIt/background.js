//Google translate automation for chrome. 
//Author:(C) 2012 Borislav Sapundzhiev
//License: This file is released under the terms of GPL v2.

function TabTrView() {

	this.menuid = 0;
	this.tabid = 0;
}

TabTrView.prototype.createContextMenu = function ( onclickEv ) {

	this.menuid = chrome.contextMenus.create({
		"title": "Translate '%s'", 
		"contexts": ["selection"],
		"onclick": onclickEv
	});
}

TabTrView.prototype.addRemoveTabListener = function (removeEv) {

	chrome.tabs.onRemoved.addListener(removeEv);
}

TabTrView.prototype.addTabId = function (TabId) {
	
	this.tabid = TabId;
}

TabTrView.prototype.remTabId = function (TabId) {
	
	if(TabId == this.tabid) {
		this.tabid = 0;
	}
}

TabTrView.prototype.createTab = function (url , createEv) { 

	if(this.tabid == 0) {
		chrome.tabs.create( {"url": url }, createEv );
	} else {
		chrome.tabs.update( this.tabid, {"active": true, "url": url } );
	}
}

function TabTrCtrl(view, opts) {

	this.view_ = view; 
	this.opts = opts;	
}

TabTrCtrl.prototype.trInitListeners = function() {

	this.view_.createContextMenu(this.trMenuEv.bind(this));	
	this.view_.addRemoveTabListener(this.trTabRemEv.bind(this));
}

TabTrCtrl.prototype.trTabAddEv = function(Tab) {

	this.view_.addTabId(Tab.id);
}

TabTrCtrl.prototype.trTabRemEv = function(Tab) {

	this.view_.remTabId(Tab);
}

TabTrCtrl.prototype.trFormatURL = function(Text) {

	if( localStorage["Transit.srcLang"] ) {
		this.opts.srcLang = localStorage["Transit.srcLang"];
	}
	if( localStorage["Transit.trgLang"] ) {
		this.opts.trgLang = localStorage["Transit.trgLang"];
	}
	
	return this.opts.url + "#" + this.opts.srcLang +"|"+ this.opts.trgLang +"|" + encodeURI(Text);
}

TabTrCtrl.prototype.trMenuEv = function(OnClickData) {
	
	var text = OnClickData.selectionText ? OnClickData.selectionText : "No selected text";
	
	this.view_.createTab(this.trFormatURL(text), this.trTabAddEv.bind(this)); 
}
								   
document.addEventListener('DOMContentLoaded', function () {
	
	try {
		var trView = new TabTrView();
		var trCtr = new TabTrCtrl(trView, {
			"url": "http://translate.google.com/",
			"srcLang": "auto", 
			"trgLang": "en"
		});
		
		trCtr.trInitListeners();
		
	}catch (e) {
		alert(e);
	}
});
