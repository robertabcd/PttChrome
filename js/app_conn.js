if (typeof lib != 'undefined')
  throw new Error('Global "lib" object already exists.');

var lib = {};

lib.AppConnection = function(spec) {
  // Callback functions.
  this.callbacks = {
    disconnect: spec.onAppDisconnect,
    paste: spec.onPasteDone,
    storage: spec.onStorageDone,
    font: spec.onSymFont
  };

  this.isConnected = false;
  this.appId = pttchrome.Constants.EXTENSION_ID;
  this.appPort = null;
};

lib.AppConnection.prototype._attachAppPort = function(port) {
  var self = this;
  this.appPort = port;
  this.appPort.onMessage.addListener(function(msg) {
    switch(msg.action) {
      case "onPasteDone":
        self.callbacks.paste(msg.data);
        break;
      case "onStorageDone":
        self.callbacks.storage(msg);
        break;
      case "onSymFont":
        self.callbacks.font(msg);
        break;
      default:
        break;
    }
  });
  this.appPort.onDisconnect.addListener(function(msg) {
    self.isConnected = false;
    self.callbacks.disconnect();
  });
  self.isConnected = true;
};

lib.AppConnection.prototype._checkChromeApp = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    if (typeof(chrome) == 'undefined' || !chrome.runtime) {
      reject();
      return;
    }
    chrome.runtime.sendMessage(self.appId, { action: 'status' }, function(response) {
      if (response)
        resolve();
      else
        reject();
    });
  });
};

lib.AppConnection.prototype._connectToApp = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    var appPort = chrome.runtime.connect(self.appId);
    if (!appPort) {
      reject();
      return;
    }
    resolve(appPort);
  });
};

lib.AppConnection.prototype.connect = function(callback) {
  var self = this;
  return this._checkChromeApp().then(function() {
    return self._connectToApp();
  }).then(function(port) {
    self._attachAppPort(port);
  });
};
