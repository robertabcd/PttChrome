'use strict';

(function() {

  var appId = 'hhnlfapopmaimdlldbknjdgekpgffmbo';

  pttchrome.AppConnection = function() {
    this.appPort = null;
    this.connected = false;
    this.handlers = {};
  };

  pttchrome.AppConnection.prototype = {

    setHandler: function(handlers) {
      this.handlers = Object.assign({}, this.handlers, handlers);
    },

    connect: function() {
      var self = this;
      return checkChromeApp().then(function() {
        return onValidChromeApp(self);
      });
    },

    connectTcp: function(host, port, keepAlive) {
      if (!this.connected) {
        return;
      }

      this.appPort.postMessage({
        action: 'connect',
        host: host,
        port: port,
        keepAlive: keepAlive
      });
    },

    sendTcp: function(str) {
      if (this.appPort === null || !this.connected) {
        return;
      }

      // because ptt seems to reponse back slowly after large
      // chunk of text is pasted, so better to split it up.
      var chunk = 1000;
      for (var i = 0; i < str.length; i += chunk) {
        var chunkStr = str.substring(i, i+chunk);
        this.appPort.postMessage({
          action: 'send',
          data: chunkStr
        });
      }
    },

    disconnect: function() {
      if (!this.connected) {
        return;
      }
      if (this.appPort) {
        try {
          this.appPort.postMessage({ action: 'disconnect' });
        } catch (e) {
        }
      }
      this.connected = false;
    }
  };

  function checkChromeApp() {
    return new Promise(function(resolve, reject) {
      
      if (!chrome.runtime) {
        showJumbo();
        return reject('no chrome.runtime');
      }

      chrome.runtime.sendMessage(appId, { action: 'status' }, function(response) {
        if (!response) {
          showJumbo();
          reject();
        } else {
          resolve();
        }
      });

    });
  }

  function onValidChromeApp(obj) {
    return new Promise(function(resolve, reject) {
      obj.appPort = chrome.runtime.connect(appId);

      obj.appPort.onMessage.addListener(function(msg) {
        if (obj.handlers[msg.action]) {
          obj.handlers[msg.action](msg.data);
        } else {
          console.warn('AppConnection: no such action handler');
        }
      });

      obj.appPort.onDisconnect.addListener(function(msg) {
        if (obj.handlers['disconnect']) {
          obj.handlers.disconnect();
        }
      });

      obj.connected = true;

      resolve();
    });
  }

  function showJumbo() {
    console.log('app is not running or installed');
    document.getElementById('welcome-jumbo').style.display = 'block';
  }


})();
