'use strict';

const KeyMap = {
  'Backspace': '\b',
  'Tab': '\t',
  'Enter': '\r',
  'Escape': '\x1b',
  'Home': '\x1b[1~',
  'Insert': '\x1b[2~',
  'Delete': '\x1b[3~',
  'End': '\x1b[4~',
  'PageUp': '\x1b[5~',
  'PageDown': '\x1b[6~',
  'ArrowUp': '\x1b[A',
  'ArrowDown': '\x1b[B',
  'ArrowRight': '\x1b[C',
  'ArrowLeft': '\x1b[D'
};
let CtrlShiftMap = {
  '@': 50,
  '^': 54,
  '_': 109,
  '?': 127,
  '[': 219,
  '\\': 220,
  ']': 221
};
// A -> 1
for (let i = 97; i <= 122; i++) {
  CtrlShiftMap[String.fromCharCode(i)] = i - 96;
}

pttchrome.TermKeyboard = class {
  // isLeftDB: function() -> bool
  // isCurDB: function() -> bool
  // send: function(data)
  constructor(isLeftDB, isCurDB, send) {
    this._checkLeftDB = isLeftDB;
    this._checkCurDB = isCurDB;
    this._sendFunc = send;
  }

  _send(data) {
    this._sendFunc(data);
    return true;
  }

  _sendCharCode(code) {
    return this._send(String.fromCharCode(code));
  }

  _checkDB(key) {
    switch (key) {
      case 'Backspace':
      case 'ArrowLeft':
        return this._checkLeftDB();
      case 'Delete':
      case 'ArrowRight':
        return this._checkCurDB();
    }
    return false;
  }

  onKeyDown(e) {
    if (this._onKeyDown(e))
      e.preventDefault();
  }

  _onKeyDown(e) {
    if (!e.ctrlKey && !e.altKey) {
      let mapped = KeyMap[e.key];
      if (mapped) {
        if (this._checkDB(e.key)) {
          return this._send(mapped + mapped);
        } else {
          return this._send(mapped);
        }
      } else if (e.key.length == 1) { // Normal char
        return this._send(e.key);
      }
    } else if (e.ctrlKey && !e.altKey && !e.shiftKey) {
      // Use lowercase no even capslock's on.
      let key = e.key.length == 1 ? e.key.toLowerCase() : e.key;
      let mappedCode = CtrlShiftMap[key];
      if (mappedCode) {
        return this._sendCharCode(mappedCode);
      }
    } else if (!e.ctrlKey && e.altKey && !e.shiftKey) {
      // Remapped keys, which conflict browser shortcuts.
      // Use lowercase no even capslock's on.
      switch (e.key.toLowerCase()) {
        case 'r':
        case 't':
        case 'w':
          // Ctrl+key
          return this._sendCharCode(e.key.toUpperCase().charCodeAt(0) - 64);
      }
    }
    return false;
  }
};
