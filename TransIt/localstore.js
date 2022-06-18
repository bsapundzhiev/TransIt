//Save options to localStorage.
//Autor:(c) 2022 Borislav Sapundzhiev
//License: This file is relased under the terms of GPL v2.

if( typeof( TransIt ) == "undefined" ) TransIt = {};
TransIt.localStore = {};

const getObjectFromLocalStorage = async function(key, defVal) {
  var storeVal = defVal;
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, function(value) {
        if(value[key]) {
          storeVal = value[key];
        }
        resolve(storeVal);
      });
    } catch (ex) {
      reject(ex);
    }
  });
};

const saveObjectInLocalStorage = async function(key, value) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set({[key]: value}, function() {
        resolve();
      });
    } catch (ex) {
      reject(ex);
    }
  });
};
 
TransIt.localStore.set = async function(key, value) {
    await saveObjectInLocalStorage(key, value);
}

TransIt.localStore.get = async function(key, defVal) {
    return await getObjectFromLocalStorage(key, defVal);
}

