pttchrome.Websocket = function(url) {
  this._conn = new WebSocket(url);
  this._conn.binaryType = "arraybuffer";
  this._conn.addEventListener('open', this._onOpen.bind(this));
  this._conn.addEventListener('message', this._onMessage.bind(this));
  this._conn.addEventListener('error', this._onError.bind(this));
  this._conn.addEventListener('close', this._onClose.bind(this));
};

pttchrome.Event.mixin(pttchrome.Websocket.prototype);

pttchrome.Websocket.prototype._onOpen = function(e) {
  this.dispatchEvent(new CustomEvent('open'));
};

pttchrome.Websocket.prototype._onMessage = function(e) {
  var data = new Uint8Array(e.data);
  this.dispatchEvent(new CustomEvent('data', {
    detail: {
      data: String.fromCharCode.apply(String, data)
    }
  }));
};

pttchrome.Websocket.prototype._onError = function(e) {
  this.dispatchEvent(new CustomEvent('error'));
};

pttchrome.Websocket.prototype._onClose = function(e) {
  this.dispatchEvent(new CustomEvent('close'));
};

pttchrome.Websocket.prototype.send = function(str) {
  // XXX: move this to app.
  // because ptt seems to reponse back slowly after large
  // chunk of text is pasted, so better to split it up.
  var chunk = 1000;
  for (var i = 0; i < str.length; i += chunk) {
    var chunkStr = str.substring(i, i+chunk);
    var byteArray = new Uint8Array(chunkStr.split('').map(function(x) { return x.charCodeAt(0); }));
    this._conn.send(byteArray.buffer);
  }
};

pttchrome.Websocket.prototype.close = function() {
  this._conn.close();
};
