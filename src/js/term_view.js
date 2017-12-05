// Terminal View

import { TermKeyboard } from './term_keyboard';
import { termInvColors } from './term_buf';
import { renderImagePreview } from './image_preview';
import { renderRowHtml } from './term_ui';
import { i18n } from './i18n';
import { setTimer } from './util';
import { wrapText, u2b, parseStatusRow } from './string_util';

export function TermView(rowCount) {
  //new pref - start
  this.screenType = 0;
  this.bbsWidth = 0;
  this.bbsHeight = 0;
  this.bbsFontSize = 14;
  this.useHyperLink = true;
  this.dbcsDetect = true;
  this.inputBufferSizeType = 0;
  this.defineInputBufferSize = 12;
  this.hideInputBuffer = false;
  this.hotkeyForSelectAll = false;
  this.highlightBG = 2;
  this.charset = 'big5';
  this.EnterChar = '\r';
  this.EscChar = '\x15'; // Ctrl-U
  this.middleButtonFunction = 0;
  this.leftButtonFunction = false;
  this.mouseWheelFunction1 = 1;
  this.mouseWheelFunction2 = 2;
  this.mouseWheelFunction3 = 3;
  //this.highlightFG = 7;
  this.DisplayBackground = false;
  this.BackgroundMD5 = '';
  this.fontFitWindowWidth = false;
  this.verticalAlignCenter = true;
  this.horizontalAlignCenter = true;
  //new pref - end

  this.bbsViewMargin = 0;
  this.cursorShow = true;

  this.buf = null;
  this.bbscore = null;
  this.page = null;

  // Cursor
  this.cursorX = 0;
  this.cursorY = 0;

  // TODO Move this into easy_reading.js
  this.useEasyReadingMode = false;
  this.easyReadingKeyDownKeyCode = 0;

  this.doHighlightOnCurRow = false;

  this.displayingRows = [];

  this.curRow = 0;
  this.curCol = 0;

  this.actualRowIndex = 0;

  this.lineWrap = 78;

  //this.DBDetection = false;
  this.blinkShow = false;
  this.blinkOn = false;
  this.doBlink = true;
  this.cursorBlinkTimer = null;

  this.selection = null;
  this.input = document.getElementById('t');
  this.bbsCursor = document.getElementById('cursor');
  this.trackKeyWordList = document.getElementById('TrackKeyWordList');
  this.BBSWin = document.getElementById('BBSWindow');
  this.enablePicPreview = true;
  this.scaleX = 1;
  this.scaleY = 1;

  var dynamicStyle = document.createElement('style');
  document.head.appendChild(dynamicStyle);
  this.dynamicCss = dynamicStyle.sheet;

  // for cpu efficiency
  this.innerBounds = { width: 0, height: 0 };
  this.firstGridOffset = { top: 0, left: 0 };

  // for notifications
  this.enableNotifications = true;
  this.titleTimer = null;
  this.notif = null;

  var mainDiv = document.createElement('div');
  mainDiv.setAttribute('class', 'main');
  var defaultRows = '';
  for (var i = 0; i < rowCount; ++i) {
    defaultRows += '<span type="bbsrow" srow="'+i+'"></span>';
    this.displayingRows.push(null);
  }
  mainDiv.innerHTML = '<div id="mainContainer">' + defaultRows + '</div>';
  this.BBSWin.appendChild(mainDiv);
  this.mainDisplay = mainDiv;

  var lastRowDiv = document.createElement('div');
  lastRowDiv.setAttribute('id', 'easyReadingLastRow');
  this.lastRowDivContent = '<span align="left"><span class="q0 b7">                                                       </span><span class="q1 b7">(y)</span><span class="q0 b7">回應</span><span class="q1 b7">(X%)</span><span class="q0 b7">推文</span><span class="q1 b7">(←)</span><span class="q0 b7">離開 </span> </span>';
  lastRowDiv.innerHTML = this.lastRowDivContent;
  this.lastRowDiv = lastRowDiv;
  this.BBSWin.appendChild(lastRowDiv);

  var replyRowDiv = document.createElement('div');
  replyRowDiv.setAttribute('id', 'easyReadingReplyRow');
  this.replyRowDivContent = '<span align="left"></span>';
  replyRowDiv.innerHTML = this.replyRowDivContent;
  this.replyRowDiv = replyRowDiv;
  this.BBSWin.appendChild(replyRowDiv);

  this.mainContainer = document.getElementById('mainContainer');
  this.mainDisplay.style.border = '0px';
  this.setFontFace('MingLiu,monospace');

  this._keyboard = new TermKeyboard(
    this.checkLeftDB.bind(this),
    this.checkCurDB.bind(this),
    this._send.bind(this));

  var self = this;
  this.input.addEventListener('compositionstart', function(e) {
    self.onCompositionStart(e);
    self.bbscore.setInputAreaFocus();
  }, false);

  this.input.addEventListener('compositionend', function(e) {
    self.onCompositionEnd(e);
    self.bbscore.setInputAreaFocus();
    // Some browsers fire another input event after composition; some not.
    // The strategy here is to ignore the inputs during composition.
    // Instead, we pull all input text at composition end, and clear input text.
    // So if input event do fire after composition end, we'll get a empty string.
    self.onInput(e);
  }, false);

  this.input.addEventListener('compositionupdate', function(e) {
  }, false);

  let keyEventFilter = (e) => {
    // On both Mac and Windows, control/alt+key will be sent as original key
    // code even under IME.
    // Char inputs will be handler on input event.
    // We can safely ignore those IME keys here.
    if (e.keyCode == 229)
      return false;

    // TODO: Since the app is almost useless on mobile devices, we might want
    // to revisit if we want this code.

    // iOS sends the keydown that starts composition as key code 0. Ignore it.
    if (e.keyCode == 0)
      return false;

    // iOS sends backspace when composing. Disallow any non-control keys during it.
    if (self.isComposition && !e.ctrlKey && !e.altKey)
      return false;

    return true;
  };

  addEventListener('keypress', (e) => {
    if (!keyEventFilter(e))
      return;
    this._keyboard.onKeyPress(e);
  });

  addEventListener('keydown', function(e) {
    if (!keyEventFilter(e))
      return;

    // disable auto update pushthread if any command is issued;
    if (!e.altKey) self.bbscore.disableLiveHelper();

    if(e.keyCode > 15 && e.keyCode < 19)
      return; // Shift Ctrl Alt (19)
    if (self.bbscore.modalShown || self.bbscore.contextMenuShown)
      return;
    if (document.getElementById('connectionAlert').style.display != 'none') {
      if (e.keyCode == 13)
        document.getElementById('connectionAlertReconnect').click();
      if (e.keyCode == 27)
        document.getElementById('connectionAlertExitAll').click();
      return;
    }
    self.onKeyDown(e);
  }, false);

  addEventListener('keyup', function(e) {
    // We don't need to handle code 229 here, as it should be already composing.

    if(e.keyCode > 15 && e.keyCode < 19)
      return; // Shift Ctrl Alt (19)
    if (self.bbscore.modalShown || self.bbscore.contextMenuShown)
      return;
    if (document.getElementById('connectionAlert').style.display != 'none' && 
      (e.keyCode == 13 || e.keyCode == 27)) {
      return;
    }
    // set input area focus whenever key down even if there is selection
    self.bbscore.setInputAreaFocus();
  }, false);

  this.input.addEventListener('input', function(e) {
    self.onInput(e);
  }, false);


}


TermView.prototype = {

  onBlink: function() {
    this.blinkOn=true;
    //   if(this.buf && this.buf.changed)
    this.buf.queueUpdate(true);
    //   else this.update();
  },

  onCursorBlink: function() {
    this.cursorShow=!this.cursorShow;
    if (this.cursorShow)
      this.bbsCursor.style.display = 'block';
    else
      this.bbsCursor.style.display = 'none';
  },

  resetCursorBlink: function() {
    if (!this._isConnected())
      return;
    var self = this;
    this.cursorShow = true;
    this.bbsCursor.style.display = 'block';
    if (this.cursorBlinkTimer) {
      this.cursorBlinkTimer.cancel();
    }
    this.cursorBlinkTimer = setTimer(true, function() {
      self.onCursorBlink();
    }, 1000);
  },

  setBuf: function(buf) {
    this.buf=buf;
  },

  setConn: function(conn) {
    this.conn=conn;
  },

  _send: function(data) {
    if (this.conn)
      this.conn.send(data);
  },

  _convSend: function(data) {
    if (this.conn)
      this.conn.convSend(data);
  },

  setCore: function(core) {
    this.bbscore=core;
  },

  _isConnected: function() {
    return this.bbscore.isConnected() && !!this.conn;
  },

  setFontFace: function(fontFace) {
    this.fontFace = fontFace;
    this.input.style.setProperty('font-family', this.fontFace, 'important');
    this.mainDisplay.style.setProperty('font-family', this.fontFace, 'important');
    this.lastRowDiv.style.setProperty('font-family', this.fontFace, 'important');
    this.replyRowDiv.style.setProperty('font-family', this.fontFace, 'important');
    document.getElementById('cursor').style.setProperty('font-family', this.fontFace, 'important');
  },

  update: function() {
    this.redraw(false);
  },

  redraw: function(force) {

    //var start = new Date().getTime();
    var cols = this.buf.cols;
    var rows = this.buf.rows;
    var lineChangeds = this.buf.lineChangeds;
    var changedLineHtmlStr = '';
    var changedLineHtmlStrs = [];
    var changedRows = [];

    var lines = this.buf.lines;
    for (var row = 0; row < rows; ++row) {
      var chh = this.chh;
      this.curRow = row;
      // resets color
      var line = lines[row];
      var lineChanged = lineChangeds[row];
      if (lineChanged === false && !force)
        continue;
      var lineUpdated = false;
      var chw = this.chw;

      for (this.curCol = 0; this.curCol < cols; ++this.curCol) {
        // always check all because it's hard to know about openSpan when jump update
        // TODO: maybe set ch.needUpdate false?
        lineUpdated = true;
      }

      if (lineUpdated) {
        lineUpdated = false;
        changedLineHtmlStrs.push(line);
        changedRows.push(row);
        lineChangeds[row] = false;
      }
    }

    if (changedLineHtmlStrs.length > 0) {
      if (this.useEasyReadingMode) {
        if (this.buf.startedEasyReading && this.buf.easyReadingShowReplyText) {
          this.updateEasyReadingReplyRow(changedLineHtmlStrs[changedLineHtmlStrs.length-1]);
        } else if (this.buf.startedEasyReading && this.buf.easyReadingShowPushInitText) {
          this.updateEasyReadingPushInitRow(changedLineHtmlStrs[changedLineHtmlStrs.length-1]);
        } else {
          this.populateEasyReadingPage();
        }
      } else {
        while (this.mainContainer.childNodes.length > rows)
          this.mainContainer.removeChild(this.mainContainer.lastChild);
        for (var i = 0; i < changedRows.length; ++i) {
          var row = changedRows[i];
          var component = renderRowHtml(
            changedLineHtmlStrs[i], row, this.chh, false,
            this.mainContainer.childNodes[row]);
          component.setHighlight(
            this.buf.highlightCursor && this.buf.currentHighlighted == row);
          this.displayingRows[row] = component;
        }
      }
      this.buf.prevPageState = this.buf.pageState;

      if (this.enablePicPreview) {
        // hide preview if any update
        renderImagePreview(document.getElementById('imagePreviewContainer'),
          null);
        this.setupPicPreviewOnHover();
      }
    }
    //var time = new Date().getTime() - start;
    //console.log(time);

  },

  setHighlightedRow: function(row) {
    if (this.currentHighlighted == row || this.currentHighlighted === null && row < 0)
      return;
    console.log('highlight: ' + row);
    if (this.currentHighlighted)
      this.displayingRows[this.currentHighlighted].setHighlight(false);
    if (row >= 0) {
      this.displayingRows[row].setHighlight(true);
      this.currentHighlighted = row;
    } else {
      this.currentHighlighted = null;
    }
  },

  onInput: function(e) {
    if (this.bbscore.modalShown || this.bbscore.contextMenuShown)
      return;
    if (this.isComposition) {
      // beginning chrome 55, we no longer can update input buffer width on compositionupdate
      // so we update it on input event
      this.updateInputBufferWidth();
      return;
    }

    if (this.useEasyReadingMode && this.buf.startedEasyReading && 
        !this.buf.easyReadingShowReplyText && !this.buf.easyReadingShowPushInitText &&
        this.easyReadingKeyDownKeyCode == 229 && e.target.value != 'X') { // only use on chinese IME
      e.target.value = '';
      return;
    }
    if (e.target.value) {
      this.onTextInput(e.target.value);
    }
    e.target.value='';
  },

  onTextInput: function(text, isPasting) {
    this.resetCursorBlink();
    if (isPasting) {
      text = text.replace(/\r\n/g, '\r');
      text = text.replace(/\n/g, '\r');
      text = text.replace(/\r/g, this.EnterChar);

      if(text.indexOf('\x1b') < 0 && this.lineWrap > 0) {
        text = wrapText(text, this.lineWrap, this.EnterChar);
      }

      //FIXME: stop user from pasting DBCS words with 2-color
      text = text.replace(/\x1b/g, this.EscChar);
    }
    this._convSend(text);
  },

  onKeyDown: function(e) {
    this.resetCursorBlink();

    if (this.useEasyReadingMode && this.buf.startedEasyReading && 
        !this.buf.easyReadingShowReplyText && !this.buf.easyReadingShowPushInitText) {
      this.easyReadingKeyDownKeyCode = e.keyCode;
      this.bbscore.easyReading._onKeyDown(e);
      if (e.defaultPrevented)
        return;
    }

    // TODO: Move this. Make a key event mapper.
    var stop = false;
    if (!e.ctrlKey && !e.altKey) {
      switch (e.key) {
        case 'End': //End
          if ((this.bbscore.buf.pageState == 2 || this.bbscore.buf.pageState == 3) &&
            this.bbscore.endTurnsOnLiveUpdate) {
            this.bbscore.onLiveHelperEnableClicked(false);
            stop = true;
          }
          break;
      }
    } else if (e.ctrlKey && !e.altKey && !e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case 'c':
          if (!window.getSelection().isCollapsed) { //^C , do copy
            var selectedText = window.getSelection().toString().replace(/\u00a0/g, " ");
            this.bbscore.doCopy(selectedText);
            stop = true
          }
          break;
        case 'a':
          this.bbscore.doSelectAll();
          stop = true;
          break;
      }
    } else if (e.ctrlKey && !e.altKey && e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case 'V':
          this.bbscore.doPaste();
          stop = true;
          break;
      }
    }
    if (stop) {
      e.preventDefault();
      return;
    }

    this._keyboard.onKeyDown(e);
    if (e.defaultPrevented)
      return;
  },

  setTermFontSize: function(cw, ch) {
    var innerBounds = this.innerBounds;
    this.chw = cw;
    this.chh = ch;
    var fontSize = this.chh + 'px';
    var mainWidth = this.chw*this.buf.cols+10 + 'px';
    this.mainDisplay.style.fontSize = fontSize;
    this.mainDisplay.style.lineHeight = fontSize;
    this.bbsCursor.style.fontSize = fontSize;
    this.bbsCursor.style.lineHeight = fontSize;
    this.mainDisplay.style.overflowX = 'hidden';
    this.mainDisplay.style.overflowY = 'auto';
    this.mainDisplay.style.textAlign = 'left';
    this.mainDisplay.style.width = mainWidth;

    this.lastRowDiv.style.fontSize = fontSize;
    this.lastRowDiv.style.width = mainWidth;

    this.replyRowDiv.style.fontSize = fontSize;
    this.replyRowDiv.style.width = mainWidth;
    if (this.verticalAlignCenter && this.chh*this.buf.rows < innerBounds.height)
      this.mainDisplay.style.marginTop = ((innerBounds.height-this.chh*this.buf.rows)/2) + this.bbsViewMargin + 'px';
    else
      this.mainDisplay.style.marginTop =  this.bbsViewMargin + 'px';
    if (this.fontFitWindowWidth) {
      this.scaleX = Math.floor(innerBounds.width / (this.chw*this.buf.cols+10) * 100)/100;
      this.scaleY = Math.floor(innerBounds.height / (this.chh*this.buf.rows) * 100)/100;
    } else {
      this.scaleX = 1;
      this.scaleY = 1;
    }

    var scaleCss = 'none';
    if (this.scaleX != 1 || this.scaleY != 1) {
      //this.mainDisplay.style.transform = 'scaleX('+this.scaleX+')'; // chrome not stable support yet!
      scaleCss = 'scale('+this.scaleX+','+this.scaleY+')';
      var transOrigin = 'left';
      if(this.horizontalAlignCenter) {
        transOrigin = 'center';
      }
      this.mainDisplay.style.webkitTransformOriginX = transOrigin;
      this.lastRowDiv.style.webkitTransformOriginX = transOrigin;
      this.replyRowDiv.style.webkitTransformOriginX = transOrigin;
      this.lastRowDiv.style.webkitTransformOriginY = '-1100%'; // somehow these are the right value
      this.replyRowDiv.style.webkitTransformOriginY = '-1010%';
    } else {
      this.lastRowDiv.style.webkitTransformOriginY = '';
      this.replyRowDiv.style.webkitTransformOriginY = '';
    }
    this.mainDisplay.style.webkitTransform = scaleCss;
    this.lastRowDiv.style.webkitTransform = scaleCss;
    this.replyRowDiv.style.webkitTransform = scaleCss;

    this.firstGridOffset = this.bbscore.getFirstGridOffsets();

    this.updateReverseScaleCss();
    this.updateCursorPos();
  },

  updateReverseScaleCss: function() {
    var rule = 'img.hyperLinkPreview { ' +
      '-webkit-transform: scale(' + Math.floor(1/this.scaleX*100)/100 + ',' +
      Math.floor(1/this.scaleY*100)/100+');' +
      ' }';
    while (this.dynamicCss.cssRules.length > 0) {
      this.dynamicCss.deleteRule(0);
    }
    this.dynamicCss.insertRule(rule, this.dynamicCss.cssRules.length);
  },

  convertMN2XYEx: function(cx, cy) {
    var origin;
    var w = this.innerBounds.width;
    var h = this.innerBounds.height;
    if(this.horizontalAlignCenter && (this.scaleX!=1 || this.scaleY!=1))
      origin = [((w - (this.chw*this.buf.cols+10)*this.scaleX)/2) + this.bbsViewMargin, ((h - (this.chh*this.buf.rows)*this.scaleY)/2) + this.bbsViewMargin];
    else
      origin = [this.firstGridOffset.left, this.firstGridOffset.top];
    var realX = origin[0] + (cx) * this.chw * this.scaleX;
    var realY = origin[1] + (cy) * this.chh * this.scaleY;
    return [realX, realY];
  },

  checkLeftDB: function() {
    if (this.dbcsDetect && this.buf.cur_x>1) {
      var lines = this.buf.lines;
      var line = lines[this.buf.cur_y];
      var ch = line[this.buf.cur_x-2];
      if (ch.isLeadByte)
        return true;
    }
    return false;
  },

  checkCurDB: function() {
    if (this.dbcsDetect) {// && this.buf.cur_x<this.buf.cols-2){
      var lines = this.buf.lines;
      var line = lines[this.buf.cur_y];
      var ch = line[this.buf.cur_x];
      if (ch.isLeadByte)
        return true;
    }
    return false;
  },

  // Cursor
  updateCursorPos: function() {

    var pos = this.convertMN2XYEx(this.buf.cur_x, this.buf.cur_y);
    // if you want to set cursor color by now background, use this.
    if (this.buf.cur_y >= this.buf.rows || this.buf.cur_x >= this.buf.cols)
      return; //sometimes, the value of this.buf.cur_x is 80 :(

    var lines = this.buf.lines;
    var line = lines[this.buf.cur_y];
    var ch = line[this.buf.cur_x];
    var bg = ch.getBg();

    if (this.scaleX == 1 && this.scaleY == 1) {
      this.bbsCursor.style.webkitTransform = 'none';
      this.lastRowDiv.style.webkitTransformOriginY = '';
      this.replyRowDiv.style.webkitTransformOriginY = '';
    } else {
      var scaleCss = 'scale('+this.scaleX+','+this.scaleY+')';
      this.mainDisplay.style.webkitTransform = scaleCss;
      this.lastRowDiv.style.webkitTransform = scaleCss;
      this.replyRowDiv.style.webkitTransform = scaleCss;
      this.bbsCursor.style.webkitTransform = scaleCss;
      this.bbsCursor.style.webkitTransformOriginX = 'left';
      this.lastRowDiv.style.webkitTransformOriginY = '-1100%';
      this.replyRowDiv.style.webkitTransformOriginY = '-1010%';
    }

    this.bbsCursor.style.left = pos[0] + 'px';
    this.bbsCursor.style.top = (pos[1] - this.scaleY) + 'px';
    // if you want to set cursor color by now background, use this.
    this.bbsCursor.style.color = termInvColors[bg];
    this.updateInputBufferPos();

  },

  updateInputBufferPos: function() {
    if (this.input.getAttribute('bshow') == '1') {
      var pos = this.convertMN2XYEx(this.buf.cur_x, this.buf.cur_y);
      if (!this.hideInputBuffer) {
        this.input.style.opacity = '1';
        this.input.style.border = 'double';
        if (this.inputBufferSizeType === 0) {
          //this.input.style.width  = (this.chh-4)*10 + 'px';
          this.input.style.fontSize = this.chh-4 + 'px';
          //this.input.style.lineHeight = this.chh+4 + 'px';
          this.input.style.height = this.chh + 'px';
        } else {
          //this.input.style.width  = ((this.defineInputBufferSize*2)-4)*10 + 'px';
          this.input.style.fontSize = ((this.defineInputBufferSize*2)-4) + 'px';
          //this.input.style.lineHeight = this.bbscore.inputBufferSize*2+4 + 'px';
          this.input.style.height = this.defineInputBufferSize*2 + 'px';
        }
      } else {
        this.input.style.border = 'none';
        this.input.style.width  = '0px';
        this.input.style.height = '0px';
        this.input.style.fontSize = this.chh + 'px';
        this.input.style.opacity = '0';
        //this.input.style.left = '-100000px';
      }
      var innerBounds = this.innerBounds;
      var bbswinheight = innerBounds.height;
      var bbswinwidth = innerBounds.width;
      if(bbswinheight < pos[1] + parseFloat(this.input.style.height) + this.chh)
        this.input.style.top = (pos[1] - parseFloat(this.input.style.height) - this.chh)+ 4 +'px';
      else
        this.input.style.top = (pos[1] + this.chh) +'px';

      if(bbswinwidth < pos[0] + parseFloat(this.input.style.width))
        this.input.style.left = bbswinwidth - parseFloat(this.input.style.width)- 10 +'px';
      else
        this.input.style.left = pos[0] +'px';

      //this.input.style.left = pos[0] +'px';
    }
  },

  updateInputBufferWidth: function() {
    // change width according to input
    var wordCounts = u2b(this.input.value).length;
    // chh / 2 - 2 because border of 1
    var oneWordWidth = (this.chh/2-2);
    var width = oneWordWidth*wordCounts;
    this.input.style.width  = width + 'px';
    var bounds = this.innerBounds;
    if (parseInt(this.input.style.left) + width + oneWordWidth*2 >= bounds.width) {
      this.input.style.left = bounds.width - width - oneWordWidth*2 + 'px';
    }
  },

  onCompositionStart: function(e) {
    //this.input.disabled="";
    this.input.setAttribute('bshow', '1');
    this.updateInputBufferPos();
    this.isComposition = true;
  },

  onCompositionEnd: function(e) {
    //this.input.disabled="";
    this.input.setAttribute('bshow', '0');
    this.input.style.border = 'none';
    this.input.style.width =  '1px';
    this.input.style.height = '1px';
    this.input.style.left =  '-100000px';
    this.input.style.top = '-100000px';
    this.input.style.opacity = '0';
    //this.input.style.top = '0px';
    //this.input.style.left = '-100000px';
    this.isComposition = false;
  },

  fontResize: function() {
    var cols = this.buf ? this.buf.cols : 80;
    var rows = this.buf ? this.buf.rows : 24;

    var innerBounds = this.innerBounds;
    var fontWidth = this.bbsFontSize * 2;

    if (this.screenType === 0 || this.screenType == 1) {
      var width = this.bbsWidth ? this.bbsWidth : innerBounds.width;
      var height = this.bbsHeight ? this.bbsHeight : innerBounds.height;
      if (width === 0 || height === 0) return; // errors for openning in a new window
      width -= 10; // for scroll bar

      var o_h, o_w, i = 4;
      var nowchh = this.chh;
      var nowchw = this.chw;
      do {
        ++i;
        nowchh = i*2;
        nowchw = i;
        o_h = (nowchh) * 24;
        o_w = nowchw * 80;
      } while (o_h <= height && o_w <= width);
      --i;
      nowchh = i*2;
      nowchw = i;
      this.setTermFontSize(nowchw, nowchh);
      fontWidth = nowchh;
    } else {
      this.setTermFontSize(this.bbsFontSize, this.bbsFontSize*2);
    }
    var forceWidthElems = document.querySelectorAll('.wpadding');
    for (var i = 0; i < forceWidthElems.length; ++i) {
      var forceWidthElem = forceWidthElems[i];
      forceWidthElem.style.width = fontWidth + 'px';
    }
  },

  getRowLineElement: function(node) {
    for (let r = node; r != r.parentNode; r = r.parentNode) {
      if (r instanceof Element &&
        r.getAttribute('data-type') == 'bbsline') {
        return r;
      }
    }
    return null;
  },

  countCol: function(node, pos) {
    let rowNode = this.getRowLineElement(node);
    if (!rowNode) {
      return { row: 0, col: 0 };
    }

    let col = 0;
    let doCount = function(cur) {
      if (cur == node) {
        col += u2b(cur.textContent.substring(0, pos)).length;
        return false;
      }
      if (cur.nodeName == '#text') {
        col += u2b(cur.textContent).length;
        return true;
      }
      for (let e of cur.childNodes) {
        if (!doCount(e)) {
          return false;
        }
      }
      return true;
    };
    doCount(rowNode);

    return {
      row: parseInt(rowNode.getAttribute('data-row')),
      col: col
    };
  },

  getSelectionColRow: function() {
    let r = window.getSelection().getRangeAt(0);
    return {
      start: this.countCol(r.startContainer, r.startOffset),
      end: this.countCol(r.endContainer, r.endOffset)
    };
  },

  setupPicPreviewOnHover: function() {
    var self = this;
    var aNodes = $([
      ".main a[href^='http://ppt.cc/']",
      ".main a[type='p']",
      ".main a[href^='http://imgur.com/']",
      ".main a[href^='https://imgur.com/']",
      ".main a[href^='http://i.imgur.com/']",
      ".main a[href^='https://i.imgur.com/']",
      ".main a[href^='https://flic.kr/p/']",
      ".main a[href^='https://www.flickr.com/photos/']"
    ].join(",")).not([
      "a[href^='http://imgur.com/a/']",
      "a[href^='https://imgur.com/a/']",
      "a[href^='http://imgur.com/gallery/']",
      "a[href^='https://imgur.com/gallery/']"
    ].join(","));
    var cont = document.getElementById('imagePreviewContainer');
    var onover = function(e) {
      renderImagePreview(cont, this.getAttribute('href'));
    };
    var onout = function(e) {
      renderImagePreview(cont, null);
    };
    for (var i = 0; i < aNodes.length; ++i) {
      var aNode = aNodes[i];
      aNode.addEventListener('mouseover', onover);
      aNode.addEventListener('mouseout', onout);
    }
  },

  showWaterballNotification: function() {
    if (!this.enableNotifications) {
      return;
    }
    var app = this.bbscore;
    //console.log('message from ' + this.waterball.userId + ': ' + this.waterball.message); 
    var title = app.waterball.userId + ' ' + i18n('notification_said');
    if (this.titleTimer) {
      this.titleTimer.cancel();
      this.titleTimer = null;
    }
    this.titleTimer = setTimer(true, function() {
      if (document.title == app.connectedUrl.site) {
        document.title = title + ' ' + app.waterball.message;
      } else {
        document.title = app.connectedUrl.site;
      }
    }, 1500);
    var options = {
      icon: require('../icon/icon_128.png'),
      body: app.waterball.message,
      tag: app.waterball.userId
    };
    this.notif = new Notification(title, options);
    this.notif.onclick = function() {
      window.focus();
    };
  },

  populateEasyReadingPage: function() {
    if (this.buf.pageState == 3 && this.buf.prevPageState == 3) {
      this.mainContainer.style.paddingBottom = '1em';
      var lastRowText = this.buf.getRowText(23, 0, this.buf.cols);
      var result = parseStatusRow(lastRowText);
      if (result) {
        // row index start with 4 or below will cause duplicated first row of next page
        // 2015-07-04: better way is to view the row 3 and row 4 as one wrapped line
        /*
        if (result.rowIndexStart < 5) {
          result.rowIndexStart -= 1;
        }
        */
        var rowOffset = this.buf.pageLines.length-1;
        var beginIndex = 1;
        var atLastPage = false;
        if ((result.pageIndex == result.pageTotal && result.pagePercent == 100) || 
            result.rowIndexStart != this.actualRowIndex) { // at last page
          atLastPage = result.rowIndexStart != this.actualRowIndex;
          // find num of rows between actualRowIndex and rowIndexStart
          var numRows = 0;
          for (var i = result.rowIndexStart; i < this.actualRowIndex + 1; ++i) {
            numRows += this.buf.pageWrappedLines[i];
          }
          beginIndex = numRows;
          rowOffset -= beginIndex-1;
        }

        for (var i = beginIndex; i < this.buf.rows-1; ++i) {
          if (i > 0 && this.buf.isTextWrappedRow(i-1)) {
            this.buf.pageWrappedLines[this.actualRowIndex] += 1;
            // if the second row is the wrapped line from first row 
            if (!atLastPage && i == beginIndex) {
              beginIndex++;
            }
          } else {
            this.buf.pageWrappedLines[++this.actualRowIndex] = 1;
          }
        }
        this.appendRows(this.buf.lines.slice(beginIndex, -1), true);
        // deep clone lines for selection (getRowText and get ansi color)
        this.buf.pageLines = this.buf.pageLines.concat(JSON.parse(JSON.stringify(this.buf.lines.slice(beginIndex, -1))));
      }
      this.buf.prevPageState = 3;
    } else {
      this.mainContainer.style.paddingBottom = '';
      this.actualRowIndex = 0;
      this.buf.pageWrappedLines = [];
      if (this.buf.pageState == 3) {
        var lastRowText = this.buf.getRowText(23, 0, this.buf.cols);
        for (var i = 0; i < this.buf.rows-1; ++i) {
          if (i == 4 || i > 0 && this.buf.isTextWrappedRow(i-1)) { // row with i == 4 and the i == 3 is the wrapped line
            this.buf.pageWrappedLines[this.actualRowIndex] += 1;
          } else {
            this.buf.pageWrappedLines[++this.actualRowIndex] = 1;
          }
        }
        this.clearRows();
        this.appendRows(this.buf.lines.slice(0, -1), true);
        this.lastRowDiv.innerHTML = this.lastRowDivContent;
        this.lastRowDiv.style.display = 'block';
        // deep clone lines for selection (getRowText and get ansi color)
        this.buf.pageLines = this.buf.pageLines.concat(JSON.parse(JSON.stringify(this.buf.lines.slice(0, -1))));
      } else {
        this.hideEasyReading();
      }
      this.buf.prevPageState = this.buf.pageState;
    }
  },

  clearRows: function() {
    this.mainContainer.innerHTML = '';
    this.displayingRows = [];
  },

  appendRows: function(lines, showsLinkPreview) {
    for (var i in lines) {
      var line = lines[i];
      var el = document.createElement('span');
      el.setAttribute('type', 'bbsrow');
      el.setAttribute('srow', this.mainContainer.childNodes.length);
      this.mainContainer.appendChild(el);
      var component = renderRowHtml(
        line, this.mainContainer.childNodes.length, this.chh,
        showsLinkPreview, el);
      this.displayingRows.push(component);
    }
  },

  renderSingleRow: function(target, row) {
    var el = document.createElement('span');
    el.setAttribute('type', 'bbsrow');
    el.setAttribute('srow', '0');
    target.appendChild(el);
    return renderRowHtml(row, 0, this.chh, false, el);
  },

  hideEasyReading: function() {
    this.lastRowDiv.style.display = '';
    this.replyRowDiv.style.display = '';
    // clear the deep cloned copy of lines
    this.buf.pageLines = [];
    this.clearRows();
    this.appendRows(this.buf.lines, false);
  },

  updateEasyReadingReplyRow: function(row) {
    var el = document.createElement('span');
    el.style = "background-color:black;";
    this.renderSingleRow(el, row);
    this.setSingleChild(this.replyRowDiv.childNodes[0], el);
    this.replyRowDiv.style.display = 'block';
  },

  updateEasyReadingPushInitRow: function(row) {
    var el = document.createElement('span');
    el.style = "background-color:black;";
    this.renderSingleRow(el, row);
    this.setSingleChild(this.lastRowDiv.childNodes[0], el);
  },

  setSingleChild: function(par, child) {
    while (par.childNodes.length > 0)
      par.removeChild(par.lastChild);
    par.appendChild(child);
  }

};
