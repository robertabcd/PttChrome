pttchrome.Event = function() {};

pttchrome.Event.mixin = function(obj) {
  for (var key in pttchrome.Event.prototype) {
    obj[key] = pttchrome.Event.prototype[key];
  }
};

pttchrome.Event.prototype.addEventListener = function(type, listener) {
  this._listeners = this._listeners || {};
  (this._listeners[type] = this._listeners[type] || []).push(listener);
};

pttchrome.Event.prototype.dispatchEvent = function(e) {
  this._listeners = this._listeners || {};
  var fns = this._listeners[e.type];
  if (fns) {
    fns = fns.slice(0);
    for (var i in fns) {
      fns[i](e);
    }
  }
};

pttchrome.Event.prototype.removeEventListener = function(type, listener) {
  this._listeners = this._listeners || {};
  var fns = this._listeners[e.type];
  if (fns) {
    for (var i in fns) {
      if (fns[i] === listener) {
        fns.splice(i, 1);
        break;
      }
    }
  }
};
