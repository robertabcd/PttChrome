export function EasyReading(core, view, termBuf) {
  this._core = core;
  this._view = view;
  this._termBuf = termBuf;

  this._turnPageLines = 22;

  this.easyReadingReachedPageEnd = false;
  this.sendCommandAfterUpdate = '';
  this.ignoreOneUpdate = false;

  function bindProperty(target, name, obj, prop) {
    if (!prop) prop = name;
    Object.defineProperty(obj, prop, {
      get: function() { return target[name]; },
      set: function(val) { target[name] = val; }
    });
  }
  bindProperty(this._view, 'useEasyReadingMode', this, '_enabled');
  bindProperty(this._termBuf, 'startedEasyReading', this);
  bindProperty(this._termBuf, 'easyReadingShowReplyText', this);
  bindProperty(this._termBuf, 'easyReadingShowPushInitText', this);

  this._termBuf.addEventListener('change', this._onChanged.bind(this));
  this._termBuf.addEventListener('viewUpdate', this._onViewUpdated.bind(this));
};

EasyReading.prototype._onChanged = function(e) {
  console.log("page state: " + this._termBuf.prevPageState + "->" + this._termBuf.pageState);
  // make sure to come back to easy reading mode
  if (this._termBuf.prevPageState == 2 &&
      this._termBuf.pageState == 3 &&
      !this._enabled && 
      this._core.pref.values.enableEasyReading &&
      this._core.connectedUrl.easyReadingSupported)
  {
    this._enabled = true;
  } else if (!this._core.pref.values.enableEasyReading) {
    this._enabled = false;
  }

  if (!this._enabled)
    return;

  var lastRowText = this._termBuf.getRowText(23, 0, this._termBuf.cols);
  // dealing with page state jump to 0 because last row wasn't updated fully 
  if (this._termBuf.pageState == 3) {
    this.startedEasyReading = true;
  } else if (this.startedEasyReading && lastRowText.parseReqNotMetText()) {
    this.easyReadingShowPushInitText = true;
  } else {
    this.easyReadingShowReplyText = false;
    this.easyReadingShowPushInitText = false;
    this.startedEasyReading = false;
  }
  if (this.startedEasyReading) {
    console.log('easy reading cursor pos: ' + this._termBuf.cur_y + ':' + this._termBuf.cur_x);
    if (this._termBuf.cur_y == 23 && this._termBuf.cur_x == 79) {
      if (this.ignoreOneUpdate) {
        this.ignoreOneUpdate = false;
        return;
      }
      var result = lastRowText.parseStatusRow();
      if (result) {
        var lastRowFirstCh = this._termBuf.lines[23][0];
        if (lastRowFirstCh.getBg() == 4 && lastRowFirstCh.getFg() == 7) {
          this.easyReadingReachedPageEnd = true;
        } else {
          this.easyReadingReachedPageEnd = false;
          if (!this.sendCommandAfterUpdate) {
            // send page down
            this.sendCommandAfterUpdate = '\x1b[6~';
          }
        }
      } else if (!this.easyReadingShowPushInitText) { // only if not showing last row text
        this._termBuf.pageState = 5;
        this.startedEasyReading = false;
      }
    } else if (this._termBuf.cur_y == 23) {
      if (!this.easyReadingShowPushInitText) {
        var lastRowText = this._termBuf.getRowText(23, 0, this._termBuf.cols);
        var result = lastRowText.parsePushInitText();
        if (result) {
          this.easyReadingShowPushInitText = true;
        } else {
          this.easyReadingShowPushInitText = false;
          return;
        }
      }
    } else if (this._termBuf.cur_y == 22) {
      var secondToLastRowText = this._termBuf.getRowText(22, 0, this._termBuf.cols);
      var result = secondToLastRowText.parseReplyText();
      if (result) {
        this.easyReadingShowReplyText = true;
      } else {
        this.easyReadingShowReplyText = false;
        return;
      }
    } else {
      // last line hasn't changed
      return;
    }
  }
};

EasyReading.prototype._onViewUpdated = function(e) {
  console.log('view update');
  if (this.sendCommandAfterUpdate) {
    console.log("send:" + this.sendCommandAfterUpdate);
    if (this.sendCommandAfterUpdate != 'skipOne') {
      this._send(this.sendCommandAfterUpdate);
    }
    this.sendCommandAfterUpdate = '';
  }
};

EasyReading.prototype.leaveCurrentPost = function() {
  console.log('leave curent post');
  if (!this.easyReadingReachedPageEnd) {
    this.ignoreOneUpdate = true;
  }
  this._termBuf.prevPageState = 0;
};

EasyReading.prototype.stopEasyReading = function() {
  console.log('stop easy reading');
  this.sendCommandAfterUpdate = 'skipOne';
};

EasyReading.prototype._send = function(data) {
  this._view.conn.send(data);
};

EasyReading.prototype._onKeyDown = function(e) {
  if (!this._enabled || !this.startedEasyReading)
    return;

  this._onKeyDownProcessUI(e);
  if (e.defaultPrevented)
    return;

  var stop = false;
  if (!e.ctrlKey && !e.altKey) {
    switch (e.key) {
      case 'Backspace':
      case 'ArrowUp':
        this._send('\x1b[D\x1b[A\x1b[C');
        stop = true;
        break;
      case 'ArrowDown':
        this._send('\x1b[D\x1b[B\x1b[C');
        stop = true;
        break;
    }
  } else if (e.ctrlKey && !e.altKey) {
    switch (e.key) {
      case 'h':
        this._send('\x1b[D\x1b[A\x1b[C');
        stop = true;
        break;
    }
  }
  if (stop)
    e.preventDefault();
};

EasyReading.prototype._scrollBy = function(lines) {
  var cont = this._view.mainDisplay;
  if (lines < 0 && cont.scrollTop == 0)
    return false;
  if (lines > 0 && cont.scrollTop >=
    this._view.mainContainer.clientHeight -
      this._view.chh * this._termBuf.rows)
    return false;
  cont.scrollTop += this._view.chh * lines;
  return true;
};

EasyReading.prototype._scrollEnd = function() {
  this._view.mainDisplay.scrollTop = this._view.mainContainer.clientHeight;
  return true;
};

EasyReading.prototype._scrollTop = function() {
  this._view.mainDisplay.scrollTop = 0;
  return true;
};

EasyReading.prototype._onKeyDownProcessUI = function(e) {
  var stop = false;
  if (!e.ctrlKey && !e.altKey) {
    switch (e.key) {
      case 'Backspace':
        stop = this._scrollBy(-this._turnPageLines);
        if (!stop)
          this.leaveCurrentPost();
        break;
      case 'ArrowRight':
      case ' ':
      case 't':
        stop = this._scrollBy(this._turnPageLines);
        if (!stop)
          this.leaveCurrentPost();
        break;
      case 'PageUp':
        this._scrollBy(-this._turnPageLines);
        stop = true;
        break;
      case 'PageDown':
        this._scrollBy(this._turnPageLines);
        stop = true;
        break;
      case 'ArrowLeft':
        this.stopEasyReading();
        break;
      case 'ArrowUp':
        stop = this._scrollBy(-1);
        if (!stop)
          this.leaveCurrentPost();
        break;
      case 'Enter':
      case 'ArrowDown':
        stop = this._scrollBy(1);
        if (!stop)
          this.leaveCurrentPost();
        break;
      case 'k':
        this._scrollBy(-1);
        stop = true;
        break;
      case 'j':
        this._scrollBy(1);
        stop = true;
        break;
      case 'Home':
      case '0':
      case 'g':
        stop = this._scrollTop();
        break;
      case 'End':
      case '$':
      case 'G':
        stop = this._scrollEnd();
        break;
      case 'Tab':
        stop = true;
        break;
      default:
        if ("abf=+-[]ABF".indexOf(e.key) >= 0) {
          this.leaveCurrentPost();
          break;
        }
        if ("123456789hops;,./\\H#OP:<>".indexOf(e.key) >= 0) {
          stop = true;
          break;
        }
    }
  } else if (e.ctrlKey && !e.altKey) {
    switch (e.key) {
      case 'f':
        this._scrollBy(this._turnPageLines);
        stop = true;
        break;
      case 'b':
        this._scrollBy(-this._turnPageLines);
        stop = true;
        break;
      case 'h':
        stop = this._scrollBy(-this._turnPageLines);
        if (!stop)
          this.leaveCurrentPost();
        break;
      default:
        if ("@^_?".indexOf(e.key) >= 0) {
          stop = true;
          break;
        }
    }
  }
  if (stop)
    e.preventDefault();
};

EasyReading.prototype._onMouseClick = function(e) {
  if (!this._enabled || !this.startedEasyReading)
    return;
  var stop = false;
  // XXX Should not use term buffer to track mouse cursor.
  switch (this._termBuf.mouseCursor) {
    case 0:
    case 1: // Arrow Left
      this.stopEasyReading();
      break;
    case 2: // Page Up
      this._scrollBy(-this._turnPageLines);
      stop = true;
      break;
    case 3: // Page Down
      this._scrollBy(this._turnPageLines);
      stop = true;
      break;
    case 4: // Home
      this._scrollTop();
      stop = true;
      break;
    case 5: // End
      this._scrollEnd();
      stop = true;
      break;
    case 6:
    case 7:
      break;
    case 8: // [
    case 9: // ]
    case 10: // =
    case 12: // Refresh post / pushed texts
    case 13: // Last post with the same title (LIST)
    case 14: // Last post with the same title (READING)
      this.leaveCurrentPost();
      break;
    default: // Do nothing
      break;
  }
  if (stop)
    e.preventDefault();
};
