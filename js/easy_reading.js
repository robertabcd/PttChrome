pttchrome.EasyReading = function(core, view, termBuf) {
  this._core = core;
  this._view = view;
  this._termBuf = termBuf;

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

pttchrome.EasyReading.prototype._onChanged = function(e) {
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

pttchrome.EasyReading.prototype._onViewUpdated = function(e) {
  console.log('view update');
  if (this.sendCommandAfterUpdate) {
    console.log("send:" + this.sendCommandAfterUpdate);
    if (this.sendCommandAfterUpdate != 'skipOne') {
      this._view.conn.send(this.sendCommandAfterUpdate);
    }
    this.sendCommandAfterUpdate = '';
  }
};

pttchrome.EasyReading.prototype.leaveCurrentPost = function() {
  console.log('leave curent post');
  if (!this.easyReadingReachedPageEnd) {
    this.ignoreOneUpdate = true;
  }
  this._termBuf.prevPageState = 0;
};

pttchrome.EasyReading.prototype.stopEasyReading = function() {
  console.log('stop easy reading');
  this.sendCommandAfterUpdate = 'skipOne';
};
