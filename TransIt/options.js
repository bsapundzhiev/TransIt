//Save options to localStorage.
//Autor:(c) 2012 Borislav Sapundzhiev
//License: This file is relased under the terms of GPL v2.

if( typeof( TransIt ) == "undefined" ) TransIt = {};
TransIt.Options = {};

TransIt.Options.storeSave = function (ComboId, StoreId) {
  var select = document.getElementById(ComboId);
  var selectValue = select.children[select.selectedIndex].value;
  TransIt.localStore.set(StoreId, selectValue);
}

TransIt.Options.storeRestore = async function(ComboId, StoreId) {
  var favorite = await TransIt.localStore.get(StoreId);
  if (!favorite) {
    TransIt.Options.storeSave(ComboId, StoreId);
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
}

TransIt.Options.populateLang = function(ComboId, StoreId) {
  var combo = document.getElementById(ComboId);
  for(var k in TransIt.languages) {
    var v = TransIt.languages[k];
    combo.add( new Option (k, v), null );
  }
  TransIt.Options.storeRestore(ComboId, StoreId);
}

TransIt.Options.populateTranslators = function(StoreId) {
  var combo = document.getElementById("translator");
  for(var k in TransIt.translators) {
    var v = TransIt.translators[k];
    combo.add( new Option (k, v), null );
  }
  TransIt.Options.storeRestore("translator", StoreId);
}

TransIt.Options.populateSearching = function(StoreId) {
  var combo = document.getElementById("searching");
  for(var k in TransIt.searching) {
    var v = TransIt.searching[k];
    combo.add( new Option (k, v), null );
  }
  TransIt.Options.storeRestore("searching", StoreId);
}

TransIt.Options.storeRestoreCheckBox = async function(checkBoxId, StoreId) {
  var checked = await TransIt.localStore.get(StoreId);
  document.getElementById(checkBoxId).checked = checked;
}

TransIt.Options.storeSaveCheckBox = async function(checkBoxId, StoreId) {
  var checked = document.getElementById(checkBoxId).checked;
  TransIt.localStore.set(StoreId, checked);
}


TransIt.Options.notify = async function() {
  chrome.runtime.sendMessage({
    "srcLang": await TransIt.localStore.get("Transit.srcLang"),
    "trgLang": await TransIt.localStore.get("Transit.trgLang"),
    "openNewTab": await TransIt.localStore.get("Transit.openNewTab", false),
    "translator": await TransIt.localStore.get("Transit.translator"),
    "searching" : await TransIt.localStore.get("Transit.searching")
  });
}

TransIt.Options.saveOptions = function() {
  TransIt.Options.storeSave("srcLang", "Transit.srcLang");
  TransIt.Options.storeSave("trgLang", "Transit.trgLang");
  TransIt.Options.storeSaveCheckBox("openNewTab", "Transit.openNewTab");
  TransIt.Options.storeSave("translator","Transit.translator");
  TransIt.Options.storeSave("searching","Transit.searching");
  TransIt.Options.notify();
}

TransIt.Options.restoreOptions = function() {
   TransIt.Options.populateLang("srcLang", "Transit.srcLang");
   TransIt.Options.populateLang("trgLang", "Transit.trgLang");
   TransIt.Options.storeRestoreCheckBox("openNewTab", "Transit.openNewTab");
   TransIt.Options.populateTranslators("Transit.translator");
   TransIt.Options.populateSearching("Transit.searching");
}

TransIt.Options.switchLanguages = async function() {
  var srcLang = await TransIt.localStore.get("Transit.srcLang"); 
  if (srcLang != 'auto') {
    await TransIt.Options.storeRestore("srcLang", "Transit.trgLang");
    await TransIt.Options.storeRestore("trgLang", "Transit.srcLang");
    TransIt.Options.saveOptions()
  } else {
    alert("Target language could not be auto, change source language first.")
  }
}

document.addEventListener('DOMContentLoaded', function() {
  TransIt.Options.restoreOptions();
  document.getElementById("srcLang").addEventListener("change", TransIt.Options.saveOptions, false);
  document.getElementById("trgLang").addEventListener("change", TransIt.Options.saveOptions, false);
  document.getElementById("langSwitch").addEventListener("click", TransIt.Options.switchLanguages, false);
  document.getElementById("openNewTab").addEventListener("click", TransIt.Options.saveOptions, false);
  document.getElementById("translator").addEventListener("change", TransIt.Options.saveOptions, false);
  document.getElementById("searching").addEventListener("change", TransIt.Options.saveOptions, false);
});

