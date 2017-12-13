﻿// Main Program
import BaseModal from 'react-overlays/lib/Modal';
import { Fade, Modal } from "react-bootstrap";
import { AnsiParser } from './ansi_parser';
import { TermView } from './term_view';
import { TermBuf } from './term_buf';
import { TelnetConnection } from './telnet';
import { Websocket } from './websocket';
import { EasyReading } from './easy_reading';
import { InputHelper } from './input_helper';
import { PttChromePref } from './pref';
import { TouchController } from './touch_controller';
import { i18n } from './i18n';
import { unescapeStr, b2u, parseWaterball } from './string_util';
import { getQueryVariable, setTimer } from './util';
import PasteShortcutAlert from '../components/PasteShortcutAlert';
import ConnectionAlert from '../components/ConnectionAlert';

export const App = function(onInitializedCallback, options) {

  this.CmdHandler = document.getElementById('cmdHandler');
  this.CmdHandler.setAttribute('useMouseBrowsing', '1');
  this.CmdHandler.setAttribute('doDOMMouseScroll','0');
  //this.CmdHandler.setAttribute('useMouseUpDown', '0');
  //this.CmdHandler.setAttribute('useMouseSwitchPage', '0');
  //this.CmdHandler.setAttribute("useMouseReadThread", '0');
  this.CmdHandler.setAttribute('useTextDragAndDrop', '0');
  this.CmdHandler.setAttribute('webContextMenu', '1');
  this.CmdHandler.setAttribute('SavePageMenu', '1');
  this.CmdHandler.setAttribute('EmbeddedPlayerMenu', '1');
  this.CmdHandler.setAttribute('PreviewPictureMenu', '0');
  this.CmdHandler.setAttribute('PushThreadMenu', '0');
  this.CmdHandler.setAttribute('OpenAllLinkMenu', '0');
  this.CmdHandler.setAttribute("MouseBrowseMenu", '0');
  this.CmdHandler.setAttribute('FileIoMenu', '0');
  this.CmdHandler.setAttribute('ScreenKeyboardMenu', '1');
  this.CmdHandler.setAttribute('ScreenKeyboardOpened', '0');
  this.CmdHandler.setAttribute('DragingWindow', '0');
  this.CmdHandler.setAttribute('MaxZIndex', 11);
  this.CmdHandler.setAttribute('allowDrag','0');
  this.CmdHandler.setAttribute('haveLink','0');
  //this.CmdHandler.setAttribute('onLink','0');
  //this.CmdHandler.setAttribute('onPicLink','0');
  this.CmdHandler.setAttribute('draging','0');
  this.CmdHandler.setAttribute('textSelected','0');
  this.CmdHandler.setAttribute('dragType','');
  this.CmdHandler.setAttribute('LastPicAddr', '0');
  this.CmdHandler.setAttribute('isMouseRightBtnDrag','0');

  this.CmdHandler.setAttribute('hideBookMarkLink','1');
  this.CmdHandler.setAttribute('hideSendLink','1');
  this.CmdHandler.setAttribute('hideBookMarkPage','1');
  this.CmdHandler.setAttribute('hideSendPage','1');
  this.CmdHandler.setAttribute('hideViewInfo','1');
  this.CmdHandler.setAttribute('SkipMouseClick','0');
  this.pref = null;

  this.view = new TermView(24);
  this.buf = new TermBuf(80, 24);
  this.buf.setView(this.view);
  //this.buf.severNotifyStr=this.getLM('messageNotify');
  //this.buf.PTTZSTR1=this.getLM('PTTZArea1');
  //this.buf.PTTZSTR2=this.getLM('PTTZArea2');
  this.view.setBuf(this.buf);
  this.view.setCore(this);
  this.parser = new AnsiParser(this.buf);
  this.easyReading = new EasyReading(this, this.view, this.buf);

  //new pref - start
  this.antiIdleStr = '\x1b\x1b';
  this.antiIdleTime = 0;
  this.idleTime = 0;
  //new pref - end

  // for picPreview
  this.curX = 0;
  this.curY = 0;

  this.inputArea = document.getElementById('t');
  this.BBSWin = document.getElementById('BBSWindow');

  // horizontally center bbs window
  this.BBSWin.setAttribute("align", "center");
  this.view.mainDisplay.style.transformOrigin = 'center';

  this.mouseLeftButtonDown = false;
  this.mouseRightButtonDown = false;

  this.inputAreaFocusTimer = null;
  this.modalShown = false;

  this.inputHelper = new InputHelper(this);

  this.lastSelection = null;

  this.waterball = { userId: '', message: '' };
  this.appFocused = true;

  this.endTurnsOnLiveUpdate = false;
  this.copyOnSelect = false;
  var version = window.navigator.userAgent.match(/Chrom(e|ium)\/(\d+)\./);
  if (version && version.length > 2) {
    this.chromeVersion = parseInt(version[2], 10);
  }

  var self = this;
  this.CmdHandler.addEventListener("OverlayCommand", function(e) {
    self.overlayCommandListener(e);
  }, false);

  window.addEventListener('click', function(e) {
    self.mouse_click(e);
  }, false);

  window.addEventListener('mousedown', function(e) {
    self.mouse_down(e);
  }, false);

  $(window).mousedown(function(e) {
    var ret = self.middleMouse_down(e);
    if (ret === false) {
      return false;
    }
  });

  window.addEventListener('mouseup', function(e) {
    self.mouse_up(e);
  }, false);

  document.addEventListener('mousemove', function(e) {
    self.mouse_move(e);
  }, false);

  document.addEventListener('mouseover', function(e) {
    self.mouse_over(e);
  }, false);

  if ('onwheel' in window) {
    window.addEventListener('wheel', function(e) {
      self.mouse_scroll(e);
    }, true);
  } else {
    window.addEventListener('mousewheel', function(e) {
      self.mouse_scroll(e);
    }, true);
  }

  window.addEventListener('contextmenu', function(e) {
    self.context_menu(e);
  }, false);

  window.addEventListener('focus', function(e) {
    self.appFocused = true;
    if (self.view.titleTimer) {
      self.view.titleTimer.cancel();
      self.view.titleTimer = null;
      document.title = self.connectedUrl.site;
      self.view.notif.close();
    }
  }, false);

  window.addEventListener('blur', function(e) {
    self.appFocused = false;
  }, false);

  this.strToCopy = null;
  document.addEventListener('copy', function(e) {
    self.onDOMCopy(e);
  });
  this.inputArea.addEventListener('paste', function(e) {
    self.onDOMPaste(e);
  });

  this.view.innerBounds = this.getWindowInnerBounds();
  this.view.firstGridOffset = this.getFirstGridOffsets();
  window.onresize = function() {
    self.onWindowResize();
  };

  window.addEventListener('beforeunload', (e) => {
    if (this.conn && this.conn.isConnected && this.buf.pageState != 0) {
      e.returnValue = 'You are currently connected. Are you sure?';
      return e.returnValue;
    }
  });

  this.isFromApp = (options.from === 'app');

  this.dblclickTimer=null;
  this.mbTimer=null;
  this.timerEverySec=null;
  this.pushthreadAutoUpdateCount = 0;
  this.maxPushthreadAutoUpdateCount = -1;
  this.onWindowResize();
  this.setupLiveHelper();
  this.setupContextMenus();
  this.contextMenuShown = false;

  this.pref = new PttChromePref(this, onInitializedCallback);

  (process.env.DEVELOPER_MODE ? import('../components/DeveloperModeAlert')
    .then(({DeveloperModeAlert}) => new Promise((resolve, reject) => {
      const container = document.getElementById('reactAlert')
      const onDismiss = () => {
        ReactDOM.unmountComponentAtNode(container)
        resolve()
      }
      ReactDOM.render(
        <DeveloperModeAlert onDismiss={onDismiss} />,
        container
      )
    })) : Promise.resolve()
  ).then(() => {
    // connect.
    this.connect(getQueryVariable('site') || process.env.DEFAULT_SITE);

    // TODO: Call onSymFont for font data when it's implemented.

    console.log("load pref from storage");
    // call getStorage to trigger load setting
    this.pref.getStorage();
  });

  // init touch only if chrome is higher than version 36
  if (this.chromeVersion && this.chromeVersion >= 37) {
    this.touch = new TouchController(this);
  }
};

App.prototype.isConnected = function() {
  return this.connectState == 1 && !!this.conn;
};

App.prototype.connect = function(url) {
  this.connectState = 0;
  console.log('connect: ' + url);

  var parsed = this._parseURLSimple(url);
  if (parsed.protocol == 'wsstelnet') {
    this._setupWebsocketConn('wss://' + parsed.hostname + parsed.path);
  } else if (parsed.protocol == 'wstelnet') {
    this._setupWebsocketConn('ws://' + parsed.hostname + parsed.path);
  } else {
    console.log('unsupport connect url protocol: ' + parser.protocol);
    return;
  }

  this.connectedUrl = {
    url: url,
    site: parsed.hostname,
    port: parsed.port,
    easyReadingSupported: true
  };
};

App.prototype._parseURLSimple = function(url) {
  var protocol = url.split(/:\/\//, 2);
  if (protocol.length != 2)
    return null;
  var hostname = protocol[1].split(/\//, 2);
  var hostport = hostname[0].split(/:/);
  if (hostport > 2)
    return null;
  var port = hostport.length > 1 ? parseInt(hostport[1]) : {
    'wstelnet': 80,
    'wsstelnet': 443,
    'telnet': 23,
    'ssh': 22
  }[protocol[0]];
  return {
    protocol: protocol[0],
    hostname: hostname[0],
    host: hostport[0],
    port: port,
    path: '/' + (hostname.length > 1 ? hostname[1] : '')
  };
};

App.prototype._setupWebsocketConn = function(url) {
  var wsConn = new Websocket(url);
  this._attachConn(new TelnetConnection(wsConn));
};

App.prototype._attachConn = function(conn) {
  var self = this;
  this.conn = conn;
  this.conn.addEventListener('open', this.onConnect.bind(this));
  this.conn.addEventListener('close', this.onClose.bind(this));
  this.conn.addEventListener('data', function(e) {
    self.onData(e.detail.data);
  });
};

App.prototype.onConnect = function() {
  this.conn.isConnected = true;
  this.view.setConn(this.conn);
  console.info("pttchrome onConnect");
  this.connectState = 1;
  this.updateTabIcon('connect');
  this.idleTime = 0;
  var self = this;
  this.timerEverySec = setTimer(true, function() {
    self.antiIdle();
    self.view.onBlink();
    self.incrementCountToUpdatePushthread();
  }, 1000);
  this.view.resetCursorBlink();
};

App.prototype.onData = function(data) {
  this.parser.feed(data);

  if (!this.appFocused && this.view.enableNotifications) {
    // parse received data for waterball
    var wb = parseWaterball(b2u(data));
    if (wb) {
      if ('userId' in wb) {
        this.waterball.userId = wb.userId;
      }
      if ('message' in wb) {
        this.waterball.message = wb.message;
      }
      this.view.showWaterballNotification();
    }
  }
};

App.prototype.onClose = function() {
  console.info("pttchrome onClose");
  if (this.timerEverySec) {
    this.timerEverySec.cancel();
  }
  if (this.view.cursorBlinkTimer) {
    this.view.cursorBlinkTimer.cancel();
  }
  this.conn.isConnected = false;

  this.cancelMbTimer();

  this.connectState = 2;
  this.idleTime = 0;

  const onDismiss = () => {
    ReactDOM.unmountComponentAtNode(container);
    this.connect(this.connectedUrl.url);
  }
  const container = document.getElementById('reactAlert');
  ReactDOM.render(
    <ConnectionAlert onDismiss={onDismiss} />,
    container
  );
  this.updateTabIcon('disconnect');
};

App.prototype.sendData = function(str) {
  if (this.connectState == 1)
    this.conn.convSend(str);
};

App.prototype.sendCmdData = function(str) {
  if (this.connectState == 1)
    this.conn.send(str);
};

App.prototype.cancelMbTimer = function() {
  if (this.mbTimer) {
    this.mbTimer.cancel();
    this.mbTimer = null;
  }
};

App.prototype.setMbTimer = function() {
  this.cancelMbTimer();
  var _this = this;
  this.mbTimer = setTimer(false, function() {
    _this.mbTimer.cancel();
    _this.mbTimer = null;
    _this.CmdHandler.setAttribute('SkipMouseClick', '0');
  }, 100);
};

App.prototype.cancelDblclickTimer = function() {
  if (this.dblclickTimer) {
    this.dblclickTimer.cancel();
    this.dblclickTimer = null;
  }
};

App.prototype.setDblclickTimer = function() {
  this.cancelDblclickTimer();
  var _this = this;
  this.dblclickTimer = setTimer(false, function() {
    _this.dblclickTimer.cancel();
    _this.dblclickTimer = null;
  }, 350);
};

App.prototype.setInputAreaFocus = function() {
  if (this.modalShown || (this.touch && this.touch.touchStarted))
    return;
  //this.DocInputArea.disabled="";
  this.inputArea.focus();
};

App.prototype.setupLiveHelper = function() {
  $('#liveHelperEnable').text(i18n('liveHelperEnable'));
  $('#liveHelperSpan').text(i18n('liveHelperSpan'));
  $('#liveHelperSpanSec').text(i18n('liveHelperSpanSec'));

  var self = this;
  $('#liveHelperEnable').click(function(e) {
    self.onLiveHelperEnableClicked(true);
  });
  $('#liveHelperEnable').tooltip({title:'Alt + r'});

  $('#liveHelperSec').change(function(e) {
    var sec = $(this).val();
    if (sec < 1) {
      sec = 1;
      $(this).val(sec);
    }
    var enableThis = $('#liveHelperEnable').hasClass('active');
    if (enableThis) {
      self.setAutoPushthreadUpdate(sec);
    }
  });

  $('#liveHelperClose').click(function(e) {
    $('#liveHelper').hide();
  });
};

App.prototype.onLiveHelperEnableClicked = function(fromUi) {
  var enableThis = !$('#liveHelperEnable').hasClass('active');
  if (enableThis) {
    // cancel easy reading mode first
    this.view.useEasyReadingMode = false;
    this.switchToEasyReadingMode();
    var sec = $('#liveHelperSec').val();
    this.setAutoPushthreadUpdate(sec);
    if (!fromUi) {
      $('#liveHelperEnable').addClass('active');
    }
  } else {
    this.disableLiveHelper(fromUi);
  }
};

App.prototype.disableLiveHelper = function(fromUi) {
  this.setAutoPushthreadUpdate(-1);
  if (!fromUi) {
    $('#liveHelperEnable').removeClass('active');
  }
};

App.prototype.switchToEasyReadingMode = function(doSwitch) {
  this.easyReading.leaveCurrentPost();
  if (doSwitch) {
    this.disableLiveHelper();
    // clear the deep cloned copy of lines
    this.buf.pageLines = [];
    if (this.buf.pageState == 3) this.view.conn.send('\x1b[D\x1b[C'); //this.view.conn.send('qr');
  } else {
    this.view.mainContainer.style.paddingBottom = '';
    this.view.lastRowIndex = 22;
    this.view.lastRowDiv.style.display = '';
    this.view.replyRowDiv.style.display = '';
    // clear the deep cloned copy of lines
    this.buf.pageLines = [];
  }
  // request the full screen
  this.view.conn.send(unescapeStr('^L'));
};

App.prototype.doCopy = function(str) {
  if (str.indexOf('\x1b') < 0) {
    str = str.replace(/\r\n/g, '\r');
    str = str.replace(/\n/g, '\r');
    str = str.replace(/ +\r/g, '\r');
  }
  this.strToCopy = str;
  document.execCommand('copy');
};

App.prototype.doCopyAnsi = function() {
  if (!this.lastSelection)
    return;

  var selection = this.lastSelection;
  var pageLines = null;
  if (this.view.useEasyReadingMode && this.buf.pageState == 3) {
    pageLines = this.buf.pageLines;
  }

  var ansiText = '';
  if (selection.start.row == selection.end.row) {
    ansiText += this.buf.getText(selection.start.row, selection.start.col, selection.end.col, true, true, false, pageLines);
  } else {
    for (var i = selection.start.row; i <= selection.end.row; ++i) {
      var scol = 0;
      var ecol = this.buf.cols-1;
      if (i == selection.start.row) {
        scol = selection.start.col;
      } else if (i == selection.end.row) {
        ecol = selection.end.col;
      }
      ansiText += this.buf.getText(i, scol, ecol, true, true, false, pageLines);
      if (i != selection.end.row ) {
        ansiText += '\r';
      }
    }
  }

  this.doCopy(ansiText);
};

App.prototype.onDOMCopy = function(e) {
  if (this.strToCopy) {
    e.clipboardData.setData('text', this.strToCopy);
    e.preventDefault();
    console.log('copied: ', this.strToCopy);
    this.strToCopy = null;
  }
};

App.prototype.doPaste = function() {
  console.log("doPaste not implemented");
  const container = document.getElementById('reactAlert')
  const onDismiss = () => {
    ReactDOM.unmountComponentAtNode(container)
    this.modalShown = false;
  }
  ReactDOM.render(
    <BaseModal
      show
      onExited={onDismiss}
      backdropClassName="modal-backdrop"
      containerClassName="modal-open"
      transition={Fade}
      dialogTransitionTimeout={Modal.TRANSITION_DURATION}
      backdropTransitionTimeout={Modal.BACKDROP_TRANSITION_DURATION}
    >
      <PasteShortcutAlert onDismiss={onDismiss} />
    </BaseModal>,
    container
  )
  this.modalShown = true;
};

App.prototype.onPasteDone = function(content) {
  //this.conn.convSend(content);
  this.view.onTextInput(content, true);
};

App.prototype.onDOMPaste = function(e) {
  let str = e.clipboardData.getData('text');
  if (str) {
    e.preventDefault();
    this.onPasteDone(str);
  }
};

App.prototype.onSymFont = function(content) {
  console.log("using " + (content ? "extension" : "system") + " font");
  var font_src = content ? 'src: url('+content.data+');' : '';
  var css = '@font-face { font-family: MingLiUNoGlyph; '+font_src+' }';
  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = css;
  document.getElementsByTagName('head')[0].appendChild(style);
};

App.prototype.doSelectAll = function() {
  window.getSelection().selectAllChildren(this.view.mainDisplay);
};

App.prototype.doSearchGoogle = function(searchTerm) {
  window.open('http://google.com/search?q='+searchTerm);
};

App.prototype.doOpenUrlNewTab = function(a) {
  var e = document.createEvent('MouseEvents');
  e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);
  a.dispatchEvent(e);
};

App.prototype.incrementCountToUpdatePushthread = function(interval) {
  if (this.maxPushthreadAutoUpdateCount == -1) {
    this.pushthreadAutoUpdateCount = 0;
    return;
  }

  if (++this.pushthreadAutoUpdateCount >= this.maxPushthreadAutoUpdateCount) {
    this.pushthreadAutoUpdateCount = 0;
    if (this.buf.pageState == 3 || this.buf.pageState == 2) {
      //this.view.conn.send('qrG');
      this.view.conn.send('\x1b[D\x1b[C\x1b[4~');
    }
  }
};
App.prototype.setAutoPushthreadUpdate = function(seconds) {
  this.maxPushthreadAutoUpdateCount = seconds;
};

App.prototype.doSettings = function() {
  $('#prefModal').modal('show');
};

App.prototype.onWindowResize = function() {
  this.view.innerBounds = this.getWindowInnerBounds();
  this.view.fontResize();

  if (this.modalShown) {
    var width = document.documentElement.clientWidth * 0.7;
    width = (width > 730) ? width : 730;
    width -= 190;
    var height = document.documentElement.clientHeight * 0.9;
    height = (height > 400) ? height: 400;
    height -= 76;
    $('#prefModal .modal-body').css('height', height + 'px');
    $('#prefModal .modal-body').css('width', width + 'px');
  }
};

App.prototype.switchMouseBrowsing = function() {
  if (this.CmdHandler.getAttribute('useMouseBrowsing')=='1') {
    this.CmdHandler.setAttribute('useMouseBrowsing', '0');
    this.buf.useMouseBrowsing=false;
  } else {
    this.CmdHandler.setAttribute('useMouseBrowsing', '1');
    this.buf.useMouseBrowsing=true;
  }

  if (!this.buf.useMouseBrowsing) {
    this.buf.BBSWin.style.cursor = 'auto';
    this.buf.clearHighlight();
    this.buf.mouseCursor=0;
    this.buf.nowHighlight=-1;
    this.buf.tempMouseCol=0;
    this.buf.tempMouseRow=0;
  } else {
    this.buf.resetMousePos();
    this.view.redraw(true);
    this.view.updateCursorPos();
  }
};

App.prototype.antiIdle = function() {
  if (this.antiIdleTime && this.idleTime > this.antiIdleTime) {
    if (this.antiIdleStr !== '' && this.connectState == 1) {
      this.conn.send(this.antiIdleStr);
      this.idleTime = 0;
    }
  } else {
    if (this.connectState == 1)
      this.idleTime += 1000;
  }
};

App.prototype.updateTabIcon = function(aStatus) {
  var icon = require('../icon/logo.png');
  switch (aStatus) {
    case 'connect':
      icon = require('../icon/logo_connect.png');
      this.setInputAreaFocus();
      break;
    case 'disconnect':
      icon = require('../icon/logo_disconnect.png');
      break;
    default:
      break;
  }

  var link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "icon");
    link.setAttribute("href", icon);
    document.head.appendChild(link);
  } else {
    link.setAttribute("href", icon);
  }
};

// use this method to get better window size in case of page zoom != 100%
App.prototype.getWindowInnerBounds = function() {
  var width = document.documentElement.clientWidth - this.view.bbsViewMargin * 2;
  var height = document.documentElement.clientHeight - this.view.bbsViewMargin * 2;
  var bounds = {
    width: width,
    height: height
  };
  return bounds;
};

App.prototype.getFirstGridOffsets = function() {
  var container = $(".main")[0];
  return {
    top: container.offsetTop,
    left: container.offsetLeft
  };
};

App.prototype.clientToPos = function(cX, cY) {
  var x;
  var y;
  var w = this.view.innerBounds.width;
  var h = this.view.innerBounds.height;
  if (this.view.horizontalAlignCenter && (this.view.scaleX != 1 || this.view.scaleY != 1)) {
    x = cX - ((w - (this.view.chw * this.buf.cols) * this.view.scaleX) / 2);
    y = cY - ((h - (this.view.chh * this.buf.rows) * this.view.scaleY) / 2);
  } else {
    x = cX - parseFloat(this.view.firstGridOffset.left);
    y = cY - parseFloat(this.view.firstGridOffset.top);
  }
  var col = Math.floor(x / (this.view.chw * this.view.scaleX));
  var row = Math.floor(y / (this.view.chh * this.view.scaleY));

  if (row < 0)
    row = 0;
  else if (row >= this.buf.rows-1)
    row = this.buf.rows-1;

  if (col < 0)
    col = 0;
  else if (col >= this.buf.cols-1)
    col = this.buf.cols-1;

  return {col: col, row: row};
};

App.prototype.onMouse_click = function (e) {
  var cX = e.clientX, cY = e.clientY;
  if (!this.conn || !this.conn.isConnected)
    return;
  if (this.inputHelper.clickedOn) {
    this.inputHelper.clickedOn = false;
    return;
  }

  // disable auto update pushthread if any command is issued;
  this.disableLiveHelper();

  // TODO make a responder stack.
  this.easyReading._onMouseClick(e);
  if (e.defaultPrevented)
    return;

  // TODO Move this to mouse browsing module.
  switch (this.buf.mouseCursor) {
    case 1:
      this.conn.send('\x1b[D');  //Arrow Left
      break;
    case 2:
      this.conn.send('\x1b[5~'); //Page Up
      break;
    case 3:
      this.conn.send('\x1b[6~'); //Page Down
      break;
    case 4:
      this.conn.send('\x1b[1~'); //Home
      break;
    case 5:
      this.conn.send('\x1b[4~'); //End
      break;
    case 6:
      if (this.buf.nowHighlight != -1) {
        var sendstr = '';
        if (this.buf.cur_y > this.buf.nowHighlight) {
          var count = this.buf.cur_y - this.buf.nowHighlight;
          for (var i = 0; i < count; ++i)
            sendstr += '\x1b[A'; //Arrow Up
        } else if (this.buf.cur_y < this.buf.nowHighlight) {
          var count = this.buf.nowHighlight - this.buf.cur_y;
          for (var i = 0; i < count; ++i)
            sendstr += '\x1b[B'; //Arrow Down
        }
        sendstr += '\r';
        this.conn.send(sendstr);
      }
      break;
    case 7:
      var pos = this.clientToPos(cX, cY);
      var sendstr = '';
      if (this.buf.cur_y > pos.row) {
        var count = this.buf.cur_y - pos.row;
        for (var i = 0; i < count; ++i)
          sendstr += '\x1b[A'; //Arrow Up
      } else if (this.buf.cur_y < pos.row) {
        var count = pos.row - this.buf.cur_y;
        for (var i = 0; i < count; ++i)
          sendstr += '\x1b[B'; //Arrow Down
      }
      sendstr += '\r';
      this.conn.send(sendstr);
      break;
    case 0:
      this.conn.send('\x1b[D'); //Arrow Left
      break;
    case 8:
      this.conn.send('['); //Previous post with the same title
      break;
    case 9:
      this.conn.send(']'); //Next post with the same title
      break;
    case 10:
      this.conn.send('='); //First post with the same title
      break;
    case 12:
      this.conn.send('\x1b[D\r\x1b[4~'); //Refresh post / pushed texts
      break;
    case 13:
      this.conn.send('\x1b[D\r\x1b[4~[]'); //Last post with the same title (LIST)
      break;
    case 14:
      this.conn.send('\x1b[D\x1b[4~[]\r'); //Last post with the same title (READING)
      break;
    default:
      //do nothing
      break;
  }
};

App.prototype.overlayCommandListener = function (e) {
  var elm = e.target;
  var cmd = elm.getAttribute("pttChromeCommand");
  if (elm) {
    if (elm.id == 'cmdHandler') {
      switch (cmd) {
        case "doArrowUp":
          if (this.view.useEasyReadingMode && this.buf.startedEasyReading) {
            if (this.view.mainDisplay.scrollTop === 0) {
              this.easyReading.leaveCurrentPost();
              this.conn.send('\x1b[D\x1b[A\x1b[C');
            } else {
              this.view.mainDisplay.scrollTop -= this.view.chh;
            }
          } else {
            this.conn.send('\x1b[A');
          }
          break;
        case "doArrowDown":
          if (this.view.useEasyReadingMode && this.buf.startedEasyReading) {
            if (this.view.mainDisplay.scrollTop >= this.view.mainContainer.clientHeight - this.view.chh * this.buf.rows) {
              this.easyReading.leaveCurrentPost();
              this.conn.send('\x1b[B');
            } else {
              this.view.mainDisplay.scrollTop += this.view.chh;
            }
          } else {
            this.conn.send('\x1b[B');
          }
          break;
        case "doPageUp":
          if (this.view.useEasyReadingMode && this.buf.startedEasyReading) {
            this.view.mainDisplay.scrollTop -= this.view.chh * this.easyReading._turnPageLines;
          } else {
            this.conn.send('\x1b[5~');
          }
          break;
        case "doPageDown":
          if (this.view.useEasyReadingMode && this.buf.startedEasyReading) {
            this.view.mainDisplay.scrollTop += this.view.chh * this.easyReading._turnPageLines;
          } else {
            this.conn.send('\x1b[6~');
          }
          break;
        case "previousThread":
          if (this.view.useEasyReadingMode && this.buf.startedEasyReading) {
            this.easyReading.leaveCurrentPost();
            this.conn.send('[');
          } else if (this.buf.pageState==2 || this.buf.pageState==3 || this.buf.pageState==4) {
            this.conn.send('[');
          }
          break;
        case "nextThread":
          if (this.view.useEasyReadingMode && this.buf.startedEasyReading) {
            this.easyReading.leaveCurrentPost();
            this.conn.send(']');
          } else if (this.buf.pageState==2 || this.buf.pageState==3 || this.buf.pageState==4) {
            this.conn.send(']');
          }
          break;
        case "doEnter":
          if (this.view.useEasyReadingMode && this.buf.startedEasyReading) {
            if (this.view.mainDisplay.scrollTop >= this.view.mainContainer.clientHeight - this.view.chh * this.buf.rows) {
              this.easyReading.leaveCurrentPost();
              this.conn.send('\r');
            } else {
              this.view.mainDisplay.scrollTop += this.view.chh;
            }
          } else {
            this.conn.send('\r');
          }
          break;
        case "doRight":
          if (this.view.useEasyReadingMode && this.buf.startedEasyReading) {
            if (this.view.mainDisplay.scrollTop >= this.view.mainContainer.clientHeight - this.view.chh * this.buf.rows) {
              this.easyReading.leaveCurrentPost();
              this.conn.send('\x1b[C');
            } else {
              this.view.mainDisplay.scrollTop += this.view.chh * this.easyReading._turnPageLines;
            }
          } else {
            this.conn.send('\x1b[C');
          }
          break;
        case "reloadTabIconDelay":
          this.doReloadTabIcon(100);
          break;
        case "reloadTabIcon":
          //alert('reloadTabIcon');
          this.reloadTabIcon();
          break;
        case "doAddTrack":
          this.doAddTrack();
          break;
        case "doDelTrack":
          this.doDelTrack();
          break;
        case "doClearTrack":
          this.doClearTrack();
          break;
        case "openSymbolInput":
          if (this.symbolinput) {
            this.symbolinput.setCore(this);
            this.symbolinput.displayWindow();
          }
          break;
        case "doSavePage":
          this.doSavePage();
          break;
        case "doCopyHtml":
          this.doCopyHtml();
          break;
        case "doSelectAll":
          this.doSelectAll();
          break;
        case "doCopy":
          this.doCopySelect();
          break;
        case "doPaste":
          this.doPaste();
          break;
        case "doOpenAllLink":
          this.doOpenAllLink();
          break;
        //case "doLoadUserSetting":
        //  this.doLoadUserSetting();
        //  break;
        case "switchMouseBrowsing":
          this.switchMouseBrowsing();
          break;
        case "openYoutubeWindow":
          var param = elm.getAttribute("YoutubeURL");
          elm.removeAttribute("YoutubeURL");
          if (this.playerMgr)
            this.playerMgr.openYoutubeWindow(param);
          break;
        case "openUstreamWindow":
          var param = elm.getAttribute("UstreamURL");
          elm.removeAttribute("UstreamURL");
          if (this.playerMgr)
            this.playerMgr.openUstreamWindow(param);
          break;
        case "openUrecordWindow":
          var param = elm.getAttribute("UrecordURL");
          elm.removeAttribute("UrecordURL");
          if (this.playerMgr)
            this.playerMgr.openUrecordWindow(param);
          break;
        case "previewPicture":
          var param = elm.getAttribute("PictureURL");
          elm.removeAttribute("PictureURL");
          if (this.picViewerMgr)
            this.picViewerMgr.openPicture(param);
          break;
        case "checkPrefExist":
          this.doSiteSettingCheck(250);
          break;
        case "pushThread":
          this.doPushThread();
          break;
        case "setAlert":
          var param = elm.getAttribute("AlertMessage");
          elm.removeAttribute("AlertMessage");
          //this.view.showAlertMessage(document.title, param);
          //alert(param);
          break;
        default:
          break;
      }
    }
    elm.removeAttribute("pttChromeCommand");
  }
};

App.prototype.onMouse_move = function(cX, cY) {
  var pos = this.clientToPos(cX, cY);
  this.buf.onMouse_move(pos.col, pos.row, false);
};

App.prototype.resetMouseCursor = function(cX, cY) {
  this.buf.BBSWin.style.cursor = 'auto';
  this.buf.mouseCursor = 11;
};

App.prototype.onPrefChange = function(pref, name) {
  try {
    switch (name) {
    case 'useMouseBrowsing':
      var useMouseBrowsing = pref.get(name);
      this.CmdHandler.setAttribute('useMouseBrowsing', useMouseBrowsing?'1':'0');
      this.buf.useMouseBrowsing = useMouseBrowsing;

      if (!this.buf.useMouseBrowsing) {
        this.buf.BBSWin.style.cursor = 'auto';
        this.buf.clearHighlight();
        this.buf.mouseCursor = 0;
        this.buf.nowHighlight = -1;
        this.buf.tempMouseCol = 0;
        this.buf.tempMouseRow = 0;
      }
      this.buf.resetMousePos();
      this.view.redraw(true);
      this.view.updateCursorPos();
      break;
    case 'mouseBrowsingHighlight':
      this.buf.highlightCursor = pref.get(name);
      this.view.redraw(true);
      this.view.updateCursorPos();
      break;
    case 'mouseBrowsingHighlightColor':
      this.view.highlightBG = pref.get(name);
      this.view.redraw(true);
      this.view.updateCursorPos();
      break;
    case 'mouseLeftFunction':
      this.view.leftButtonFunction = pref.get(name);
      if (typeof(this.view.leftButtonFunction) == 'boolean') {
        this.view.leftButtonFunction = this.view.leftButtonFunction ? 1:0;
      }
      break;
    case 'mouseMiddleFunction':
      this.view.middleButtonFunction = pref.get(name);
      break;
    case 'mouseWheelFunction1':
      this.view.mouseWheelFunction1 = pref.get(name);
      break;
    case 'mouseWheelFunction2':
      this.view.mouseWheelFunction2 = pref.get(name);
      break;
    case 'mouseWheelFunction3':
      this.view.mouseWheelFunction3 = pref.get(name);
      break;
    case 'copyOnSelect':
      this.copyOnSelect = pref.get(name);
      break;
    case 'endTurnsOnLiveUpdate':
      this.endTurnsOnLiveUpdate = pref.get(name);
      break;
    case 'enablePicPreview':
      // TODO: move this to ImagePreview.
      this.view.enablePicPreview = pref.get(name);
      break;
    case 'enableNotifications':
      this.view.enableNotifications = pref.get(name);
      break;
    case 'enableEasyReading':
      /*if (this.connectedUrl.site == 'ptt.cc') {
        this.view.useEasyReadingMode = this.pref.get('enableEasyReading');
      } else {
        this.view.useEasyReadingMode = false;
      }*/
      break;
    case 'antiIdleTime':
      this.antiIdleTime = pref.get(name) * 1000;
      break;
    case 'dbcsDetect':
      this.view.dbcsDetect = pref.get(name);
      break;
    case 'lineWrap':
      this.conn.lineWrap = pref.get(name);
      break;
    case 'fontFitWindowWidth':
      this.view.fontFitWindowWidth = pref.get(name);
      if (this.view.fontFitWindowWidth) {
        $('.main').addClass('trans-fix');
      } else {
        $('.main').removeClass('trans-fix');
      }
      this.onWindowResize();
      break;
    case 'fontFace':
      var fontFace = pref.get(name);
      if (!fontFace) 
        fontFace='monospace';
      this.view.setFontFace(fontFace);
      break;
    case 'bbsMargin':
      var margin = pref.get(name);
      this.view.bbsViewMargin = margin;
      this.onWindowResize();
      break;
    default:
      break;
    }
  } catch(e) {
    // eats all errors
    return;
  }
};

App.prototype.checkClass = function(cn) {
  return (  cn.indexOf("closeSI") >= 0  || cn.indexOf("EPbtn") >= 0 || 
      cn.indexOf("closePP") >= 0 || cn.indexOf("picturePreview") >= 0 || 
      cn.indexOf("drag") >= 0    || cn.indexOf("floatWindowClientArea") >= 0 || 
      cn.indexOf("WinBtn") >= 0  || cn.indexOf("sBtn") >= 0 || 
      cn.indexOf("nonspan") >= 0 || cn.indexOf("nomouse_command") >= 0);
};

App.prototype.mouse_click = function(e) {
  if (this.modalShown)
    return;

  var skipMouseClick = (this.CmdHandler.getAttribute('SkipMouseClick') == '1');
  this.CmdHandler.setAttribute('SkipMouseClick','0');

  if (e.button == 2) { //right button
  } else if (e.button === 0) { //left button
    if ($(e.target).is('a') || $(e.target).parent().is('a')) {
      return;
    }
    if (window.getSelection().isCollapsed) { //no anything be select
      if (this.buf.useMouseBrowsing) {
        var doMouseCommand = true;
        if (e.target.className)
          if (this.checkClass(e.target.className))
            doMouseCommand = false;
        if (e.target.tagName)
          if(e.target.tagName.indexOf("menuitem") >= 0 )
            doMouseCommand = false;
        if (skipMouseClick) {
          doMouseCommand = false;
          var pos = this.clientToPos(e.clientX, e.clientY);
          this.buf.onMouse_move(pos.col, pos.row, true);
        }
        if (doMouseCommand) {
          this.onMouse_click(e);
          this.setDblclickTimer();
          e.preventDefault();
          this.setInputAreaFocus();
        }
      } else if (this.view.leftButtonFunction) {
        if (this.view.leftButtonFunction == 1) {
          this.setBBSCmd('doEnter', this.CmdHandler);
          e.preventDefault();
          this.setInputAreaFocus();
        } else if (this.view.leftButtonFunction == 2) {
          this.setBBSCmd('doRight', this.CmdHandler);
          e.preventDefault();
          this.setInputAreaFocus();
        }
      }
    }
  } else if (e.button == 1) { //middle button
  } else {
  }
};

App.prototype.middleMouse_down = function(e) {
  // moved to here because middle click works better with jquery
  if (e.button == 1) {
    if ($(e.target).is('a') || $(e.target).parent().is('a')) {
      return;
    }
    if (this.view.middleButtonFunction == 1) {
      this.conn.send('\r');
      return false;
    } else if (this.view.middleButtonFunction == 2) {
      this.conn.send('\x1b[D');
      return false;
    } else if (this.view.middleButtonFunction == 3) {
      this.doPaste();
      return false;
    }
  }
};

App.prototype.mouse_down = function(e) {
  if (this.modalShown)
    return;
  //0=left button, 1=middle button, 2=right button
  if (e.button === 0) {
    if (this.buf.useMouseBrowsing) {
      if (this.dblclickTimer) { //skip
        e.preventDefault();
        e.stopPropagation();
        e.cancelBubble = true;
      }
      this.setDblclickTimer();
    }
    this.mouseLeftButtonDown = true;
    //this.setInputAreaFocus();
    if (!(window.getSelection().isCollapsed))
      this.CmdHandler.setAttribute('SkipMouseClick','1');

    var onbbsarea = true;
    if (e.target.className)
      if (this.checkClass(e.target.className))
        onbbsarea = false;
    if (e.target.tagName)
      if (e.target.tagName.indexOf("menuitem") >= 0 )
        onbbsarea = false;
  } else if(e.button == 2) {
    this.mouseRightButtonDown = true;
  }
};

App.prototype.mouse_up = function(e) {
  if (this.modalShown)
    return;
  //0=left button, 1=middle button, 2=right button
  if (e.button === 0) {
    this.setMbTimer();
    //this.CmdHandler.setAttribute('MouseLeftButtonDown', '0');
    this.mouseLeftButtonDown = false;
  } else if (e.button == 2) {
    this.mouseRightButtonDown = false;
    //this.CmdHandler.setAttribute('MouseRightButtonDown', '0');
  }

  if (e.button === 0 || e.button == 2) { //left or right button
    if (window.getSelection().isCollapsed) { //no anything be select
      if (this.buf.useMouseBrowsing)
        this.onMouse_move(e.clientX, e.clientY);

      this.setInputAreaFocus();
      if (e.button === 0) {
        var preventDefault = true;
        if (e.target.className)
          if (this.checkClass(e.target.className))
            preventDefault = false;
        if (e.target.tagName)
          if (e.target.tagName.indexOf("menuitem") >= 0 )
            preventDefault = false;
        if (preventDefault)
          e.preventDefault();
      }
    } else { //something has be select
      if (this.copyOnSelect) {
        this.doCopy(window.getSelection().toString().replace(/\u00a0/g, " "));
      }
    }
  } else {
    this.setInputAreaFocus();
    e.preventDefault();
  }
  var _this = this;
  this.inputAreaFocusTimer = setTimer(false, function() {
    clearTimeout(_this.inputAreaFocusTimer);
    _this.inputAreaFocusTimer = null;
    if (window.getSelection().isCollapsed)
      _this.setInputAreaFocus();
  }, 10);
};

App.prototype.mouse_move = function(e) {
  if (this.inputHelper.mouseDown) {
    this.inputHelper.onMouseDrag(e);
    return;
  }

  if (this.buf.useMouseBrowsing) {
    if (window.getSelection().isCollapsed) {
      if(!this.mouseLeftButtonDown)
        this.onMouse_move(e.clientX, e.clientY);
    } else
      this.resetMouseCursor();
  }

};

App.prototype.mouse_over = function(e) {
  if (this.modalShown)
    return;

  this.curX = e.clientX;
  this.curY = e.clientY;

  if(window.getSelection().isCollapsed && !this.mouseLeftButtonDown)
    this.setInputAreaFocus();
};

App.prototype.mouse_scroll = function(e) {
  if (this.modalShown) 
    return;
  // if in easyreading, use it like webpage
  if (this.view.useEasyReadingMode && this.buf.pageState == 3) {
    return;
  }

  var cmdhandler = this.CmdHandler;

  // scroll = up/down
  // hold right mouse key + scroll = page up/down
  // hold left mouse key + scroll = thread prev/next
  var mouseWheelActionsUp = [ 'none', 'doArrowUp', 'doPageUp', 'previousThread' ];
  var mouseWheelActionsDown = [ 'none', 'doArrowDown', 'doPageDown', 'nextThread' ];

  if (e.deltaY < 0 || e.wheelDelta > 0) { // scrolling up
    if (this.mouseRightButtonDown) {
      var action = mouseWheelActionsUp[this.view.mouseWheelFunction2];
      if (action !== 'none') {
        this.setBBSCmd(action, cmdhandler);
      }
    } else if (this.mouseLeftButtonDown) {
      var action = mouseWheelActionsUp[this.view.mouseWheelFunction3];
      if (action !== 'none') {
        this.setBBSCmd(action, cmdhandler);
        this.setBBSCmd('cancelHoldMouse', cmdhandler);
      }
    } else {
      var action = mouseWheelActionsUp[this.view.mouseWheelFunction1];
      if (action !== 'none') {
        this.setBBSCmd(action, cmdhandler);
      }
    }
  } else { // scrolling down
    if (this.mouseRightButtonDown) {
      var action = mouseWheelActionsDown[this.view.mouseWheelFunction2];
      if (action !== 'none') {
        this.setBBSCmd(action, cmdhandler);
      }
    } else if (this.mouseLeftButtonDown) {
      var action = mouseWheelActionsDown[this.view.mouseWheelFunction3];
      if (action !== 'none') {
        this.setBBSCmd(action, cmdhandler);
        this.setBBSCmd('cancelHoldMouse', cmdhandler);
      }
    } else {
      var action = mouseWheelActionsDown[this.view.mouseWheelFunction1];
      if (action !== 'none') {
        this.setBBSCmd(action, cmdhandler);
      }
    }
  }
  e.stopPropagation();
  e.preventDefault();

  if (this.mouseRightButtonDown) //prevent context menu popup
    cmdhandler.setAttribute('doDOMMouseScroll','1');
  if (this.mouseLeftButtonDown) {
    if (this.buf.useMouseBrowsing) {
      cmdhandler.setAttribute('SkipMouseClick','1');
    }
  }
};

App.prototype.showQuickSearchMenus = function(e, selectedText, hideContextMenu) {
  var self = this;
  if (this.pref.quickSearches.length === 0) return;

  var menuSelector = '#quickSearchMenus';
  var menuHtml = '';
  for (var i = 0; i < this.pref.quickSearches.length; ++i) {
    var q = this.pref.quickSearches[i];
    menuHtml += '<li class="cmenuItem"><a data-url="'+q.url+'">'+q.name+'</a></li>';
  }
  $(menuSelector).html(menuHtml);
  
  $('#quickSearchMenus a').off();
  $('#quickSearchMenus a').click(function(e) {
    var url = $(this).data('url');
    url = url.replace('%s', selectedText);
    window.open(url);
    e.stopPropagation();
    hideContextMenu();
  });

  var pageHeight = $(window).height();
  var pageWidth = $(window).width();
  if (e.pageY > pageHeight/2) {
    $(menuSelector).addClass('cmenuGoesUp');
  } else {
    $(menuSelector).removeClass('cmenuGoesUp');
  }
  if (e.pageX > pageWidth * 0.8) {
    $(menuSelector).addClass('cmenuGoesLeft');
  } else {
    $(menuSelector).removeClass('cmenuGoesLeft');
  }
};

App.prototype.setupContextMenus = function() {
  var self = this;
  var menuSelector = '#contextMenus';
  var selectedText = '';
  var contextOnUrl = '';
  var contextOnUserId = '';
  var aElement = null;

  $('#BBSWindow').on('contextmenu', function(e) {
    // if i am doing scrolling, i should skip
    var cmdhandler = self.CmdHandler;
    var doDOMMouseScroll = (cmdhandler.getAttribute('doDOMMouseScroll')=='1');
    if (doDOMMouseScroll) {
      e.stopPropagation();
      e.preventDefault();
      cmdhandler.setAttribute('doDOMMouseScroll','0');
      return;
    }

    var target = $(e.target);
    contextOnUrl = '';
    contextOnUserId = '';

    // just in case the selection get de-selected
    if (window.getSelection().isCollapsed) {
      self.lastSelection = null;
    } else {
      self.lastSelection = self.view.getSelectionColRow();
    }

    aElement = null;
    if (target.is('a')) {
      contextOnUrl = target.attr('href');
      aElement = target[0];
    } else if (target.parent().is('a')) {
      contextOnUrl = target.parent().attr('href');
      aElement = target[0].parentNode;
    }

    // replace the &nbsp;
    selectedText = window.getSelection().toString().replace(/\u00a0/g, " ");

    if (contextOnUrl) {
      $('.contextQuickSearch').hide();
      $('.contextUrl').show();
      $('.contextSel').hide();
      $('.contextNormal').hide();
    } else {
      if (window.getSelection().isCollapsed) { 
        $('.contextQuickSearch').hide();
        $('.contextUrl').hide();
        $('.contextSel').hide();
        $('.contextNormal').show();
      } else {
        // got something selected, show copy and searchGoogle
        $('.contextUrl').hide();
        $('.contextSel').show();
        $('.contextNormal').hide();
        var clipedText = selectedText;
        if (clipedText.length > 15) {
          clipedText = clipedText.substr(0, 15) + ' ... ';
        }
        $('#cmenuSearchContent').text("'"+clipedText+"'");
        if (self.pref.quickSearches.length > 0) {
          self.showQuickSearchMenus(e, selectedText, function() {
            hideContextMenu();
          });
          $('.contextQuickSearch').show();
        } else {
          $('.contextQuickSearch').hide();
        }
      }
    }

    // check if mouse browsing is on
    if (self.buf.useMouseBrowsing) {
      $('#cmenu_mouseBrowsing a').addClass('checked');
    } else {
      $('#cmenu_mouseBrowsing a').removeClass('checked');
    }

    // show and position
    $(menuSelector)
      .show()
      .css({
        position: "absolute",
        left: function(e) {
          var mouseWidth = e.pageX;
          var pageWidth = $(window).width();
          var menuWidth = $(menuSelector).width();
          
          // opening menu would pass the side of the page
          if (mouseWidth + menuWidth > pageWidth &&
              menuWidth < mouseWidth) {
              return mouseWidth - menuWidth;
          } 
          return mouseWidth;
        }(e),
        top: function(e) {
          var mouseHeight = e.pageY;
          var pageHeight = $(window).height();
          var menuHeight = $(menuSelector).height();

          // opening menu would pass the bottom of the page
          if (mouseHeight + menuHeight > pageHeight &&
              menuHeight < mouseHeight) {
              return mouseHeight - menuHeight;
          } 
          return mouseHeight;
        }(e)
      });
    self.contextMenuShown = true;
    return false;
  });

  var hideContextMenu = function() {
    $(menuSelector).hide();
    selectedText = '';
    self.contextMenuShown = false;
  };

  // for menuitem shortkey
  $(window).keyup(function(e) {
    if (!self.contextMenuShown)
      return;
    if (!e.altKey && !e.ctrlKey && !e.shiftKey) {
      switch (e.keyCode) {
        case 67: // C
          self.doCopy(selectedText);
          hideContextMenu();
          break;
        case 69: // E
          self.doCopy(contextOnUrl);
          hideContextMenu();
          break;
        case 80: // P
          self.doPaste();
          hideContextMenu();
          break;
        case 83: // S
          self.doSearchGoogle(selectedText);
          hideContextMenu();
          break;
        case 84: // T
          self.doOpenUrlNewTab(aElement);
          hideContextMenu();
          break;
      }
    }
    e.preventDefault();
    e.stopPropagation();
  });

  //make sure menu closes on any click
  $(window).click(function() {
    hideContextMenu();
  });
  if ('ontouchstart' in window) {
    window.ontouchstart = function(e) {
      if (e.target.parentNode.classList.length > 0 &&
          e.target.parentNode.classList[0] == 'cmenuItem') {
        return;
      }
      hideContextMenu();
    };
  }

  $('#cmenu_copy a').html(i18n('cmenu_copy')+'<span class="cmenuHotkey">Ctrl+C</span>');
  $('#cmenu_copyAnsi a').text(i18n('cmenu_copyAnsi'));
  $('#cmenu_paste a').html(i18n('cmenu_paste')+'<span class="cmenuHotkey">Shift+Insert</span>');
  $('#cmenu_selectAll a').html(i18n('cmenu_selectAll')+'<span class="cmenuHotkey">Ctrl+A</span>');
  $('#cmenu_searchGoogle a').html(i18n('cmenu_searchGoogle')+' <span id="cmenuSearchContent"></span>');
  $('#cmenu_quickSearch a').html(i18n('cmenu_quickSearch')+' <span style="float:right;">&#9658;</span>');
  $('#cmenu_openUrlNewTab a').text(i18n('cmenu_openUrlNewTab'));
  $('#cmenu_copyLinkUrl a').text(i18n('cmenu_copyLinkUrl'));
  $('#cmenu_mouseBrowsing a').text(i18n('cmenu_mouseBrowsing'));
  $('#cmenu_showInputHelper a').text(i18n('cmenu_showInputHelper'));
  $('#cmenu_showLiveArticleHelper a').text(i18n('cmenu_showLiveArticleHelper'));
  $('#cmenu_settings a').text(i18n('cmenu_settings'));

  var contextMenuItemOnClickHandler = {
    'cmenu_copy': function() { 
      self.doCopy(selectedText); 
    },
    'cmenu_copyAnsi': function() { 
      self.doCopyAnsi(); 
    },
    'cmenu_paste': function() { 
      self.doPaste(); 
    },
    'cmenu_selectAll': function() { 
      self.doSelectAll(); 
    },
    'cmenu_searchGoogle': function() { 
      self.doSearchGoogle(selectedText); 
    },
    'cmenu_openUrlNewTab': function() { 
      self.doOpenUrlNewTab(aElement); 
    },
    'cmenu_copyLinkUrl': function() {
      self.doCopy(contextOnUrl); 
    },
    'cmenu_mouseBrowsing': function() { 
      self.switchMouseBrowsing(); 
    },
    'cmenu_showInputHelper': function() { 
      self.inputHelper.showHelper(); 
    },
    'cmenu_showLiveArticleHelper': function() { 
      $('#liveHelper').show(); 
    },
    'cmenu_settings': function() { 
      self.doSettings(); 
    }
  };

  $('.cmenuItem').click(function(e) {
    var id = $(this).attr('id');
    if (id in contextMenuItemOnClickHandler) {
      contextMenuItemOnClickHandler[id]();
    }
    e.stopPropagation();
    hideContextMenu();
  });

  $(menuSelector).on('contextmenu', function(e) {
    e.stopPropagation();
    e.preventDefault();
  });
};

App.prototype.context_menu = function(e) {
  var cmdhandler = this.CmdHandler;
  var doDOMMouseScroll = (cmdhandler.getAttribute('doDOMMouseScroll')=='1');
  if (doDOMMouseScroll) {
    e.stopPropagation();
    e.preventDefault();
    cmdhandler.setAttribute('doDOMMouseScroll','0');
    return;
  }
};

App.prototype.setBBSCmd = function(cmd, cmdhandler) {
  //var doc = gBrowser.contentDocument;
  var doc = document;
  if (!cmdhandler)
    cmdhandler = this.getCmdHandler();

  if (cmdhandler && "createEvent" in doc) {
    cmdhandler.setAttribute('pttChromeCommand', cmd);
    var evt = doc.createEvent("Events");
    evt.initEvent("OverlayCommand", false, false);
    cmdhandler.dispatchEvent(evt);
  }
};
