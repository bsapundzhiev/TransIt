//Save options to localStorage.
//Autor:(c) 2012 Borislav Sapundzhiev
//License: This file is relased under the terms of GPL v2.

if( typeof( TransIt ) == "undefined" ) TransIt = {};
TransIt.Options = {};

TransIt.Options.storeSave = function (ComboId, StoreId) {
  var select = document.getElementById(ComboId);
  var srcLang = select.children[select.selectedIndex].value;
  TransIt.localStore.set(StoreId, srcLang);
}

TransIt.Options.storeRestore = async function(ComboId, StoreId) {
  var favorite = await TransIt.localStore.get(StoreId);
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
}

TransIt.Options.populateLang = function(ComboId, StoreId) {
  var combo = document.getElementById(ComboId);
  for(var k in TransIt.languages) {
    var v = TransIt.languages[k];
    combo.add( new Option (k, v), null );
  }
  TransIt.Options.storeRestore(ComboId, StoreId);
}

TransIt.Options.notify = async function() {
  chrome.runtime.sendMessage({
    "srcLang": await TransIt.localStore.get("Transit.srcLang"),
    "trgLang": await TransIt.localStore.get("Transit.trgLang")
  });
}

TransIt.Options.saveOptions = function() {
  TransIt.Options.storeSave("srcLang", "Transit.srcLang");
  TransIt.Options.storeSave("trgLang", "Transit.trgLang");
  TransIt.Options.notify();
}

TransIt.Options.restoreOptions = function() {
   TransIt.Options.populateLang("srcLang", "Transit.srcLang");
   TransIt.Options.populateLang("trgLang", "Transit.trgLang");
}

document.addEventListener('DOMContentLoaded', function() {
  TransIt.Options.restoreOptions();
  document.getElementById("srcLang").addEventListener("change", TransIt.Options.saveOptions , false);
  document.getElementById("trgLang").addEventListener("change", TransIt.Options.saveOptions , false);
});

