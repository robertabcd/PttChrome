pttchrome.TcpSocket = function() {
  this.isConnected = false;
  this.appId = pttchrome.Constants.EXTENSION_ID;
  this.appPort = null;
};

pttchrome.Event.mixin(pttchrome.TcpSocket.prototype);

pttchrome.TcpSocket.prototype._attachAppPort = function(port) {
  var self = this;
  this.appPort = port;
  this.appPort.onMessage.addListener(function(msg) {
    switch(msg.action) {
      case 'connected':
        self.dispatchEvent(new CustomEvent('open'));
        break;
      case 'disconnect':
        self.dispatchEvent(new CustomEvent('close'));
        break;
      case 'onReceive':
        self.dispatchEvent(new CustomEvent('data', {
          detail: {
            data: msg.data
          }
        }));
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

pttchrome.TcpSocket.prototype._checkChromeApp = function() {
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

pttchrome.TcpSocket.prototype._connectToApp = function(msg) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var appPort = chrome.runtime.connect(self.appId, msg);
    if (!appPort) {
      reject();
      return;
    }
    resolve(appPort);
  });
};

pttchrome.TcpSocket.prototype.connect = function(host, port) {
  var self = this;
  return this._checkChromeApp().then(function() {
    return self._connectToApp();
  }).then(function(appPort) {
    self._attachAppPort(appPort);
    appPort.postMessage({
      action: 'connect',
      host: host,
      port: port
    });
  });
};

pttchrome.TcpSocket.prototype.send = function(data) {
  this.appPort.postMessage({
    action: 'send',
    data: data
  });
};
