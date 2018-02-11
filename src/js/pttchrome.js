// Main Program
import { AnsiParser } from './ansi_parser';
import { TermView } from './term_view';
import { TermBuf } from './term_buf';
import { TelnetConnection } from './telnet';
import { Websocket } from './websocket';
import { EasyReading } from './easy_reading';
import { TouchController } from './touch_controller';
import { unescapeStr } from './string_util';
import { setTimer } from './util';
import ReactApp from "../components/App";
import { Callbag } from "../components/Callbag";
import { reducer, initialState } from "../components/reducer";

function noop() {}

export const App = function() {

  this.CmdHandler = document.getElementById('cmdHandler');
  this.CmdHandler.setAttribute('doDOMMouseScroll','0');
  this.CmdHandler.setAttribute('SkipMouseClick','0');

  this.view = new TermView(this);
  this.buf = new TermBuf(80, 24);
  this.buf.setView(this.view);
  //this.buf.severNotifyStr=this.getLM('messageNotify');
  //this.buf.PTTZSTR1=this.getLM('PTTZArea1');
  //this.buf.PTTZSTR2=this.getLM('PTTZArea2');
  this.view.setBuf(this.buf);
  this.parser = new AnsiParser(this.buf);
  this.easyReading = new EasyReading(this, this.view, this.buf);


  // React
  ReactDOM.render(
    <Callbag
      ref={ref => { this.reactCallbag = ref; }}
      reducer={reducer}
      initialState={initialState}
      legacy={{
        bbscore: this,
        buf: this.buf,
        view: this.view,
      }}
    >
      <ReactApp />
    </Callbag>,
    document.getElementById('reactRoot')
  );




  this.mouseLeftButtonDown = false;
  this.mouseRightButtonDown = false;

  this.inputAreaFocusTimer = null;

  this.lastSelection = null;


  var version = window.navigator.userAgent.match(/Chrom(e|ium)\/(\d+)\./);
  if (version && version.length > 2) {
    this.chromeVersion = parseInt(version[2], 10);
  }




  this.strToCopy = null;
  

  this.dblclickTimer=null;
  this.mbTimer=null;
  this.pushthreadAutoUpdateCount = 0;
  this.maxPushthreadAutoUpdateCount = -1;

  // init touch only if chrome is higher than version 36
  if (this.chromeVersion && this.chromeVersion >= 37) {
    this.touch = new TouchController(this);
  }
};

App.prototype.connect = function(url) {
  this.reactCallbag.onBeforeConnect();
  console.log('connect: ' + url);

  var parsed = this._parseURLSimple(url);
  if (parsed.protocol == 'wsstelnet') {
    this._setupWebsocketConn('wss://' + parsed.hostname + parsed.path);
  } else if (parsed.protocol == 'wstelnet') {
    this._setupWebsocketConn('ws://' + parsed.hostname + parsed.path);
  } else {
    console.log('unsupport connect url protocol: ' + parsed.protocol);
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
  this.conn = conn;
  this.conn.addEventListener('open', this.onConnect.bind(this));
  this.conn.addEventListener('close', this.onClose.bind(this));
  this.conn.addEventListener('data', this.onData.bind(this));
};

App.prototype.onConnect = function() {
  this.view.setConn(this.conn);
  console.info("pttchrome onConnect");
  this.reactCallbag.onConnected();
};

App.prototype.onData = function({ detail: { data } }) {
  console.log('onData', data)
  this.parser.feed(data);
  this.reactCallbag.onData(data);
};

App.prototype.onClose = function() {
  console.info("pttchrome onClose");
  this.reactCallbag.onClosed();
  this.cancelMbTimer();
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

App.prototype.switchToEasyReadingMode = function() {
  this.easyReading.leaveCurrentPost();
  if (this.easyReading._enabled) {
    this.reactCallbag.onDisableLiveHelper();
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
  if (this.easyReading._enabled && this.buf.pageState == 3) {
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

App.prototype.getFirstGridOffsets = function() {
  var container = $(".View__Main")[0];
  return {
    top: container.offsetTop,
    left: container.offsetLeft
  };
};

App.prototype.clientToPos = function(cX, cY) {
  const firstGridOffset = this.getFirstGridOffsets();
  var x;
  var y;
  var w = this.reactCallbag.state.screen.innerBounds.width;
  var h = this.reactCallbag.state.screen.innerBounds.height;
  if (this.reactCallbag.state.screen.scaleX != 1 || this.reactCallbag.state.screen.scaleY != 1) {
    x = cX - ((w - (this.reactCallbag.state.screen.chw * this.buf.cols) * this.reactCallbag.state.screen.scaleX) / 2);
    y = cY - ((h - (this.reactCallbag.state.screen.chh * this.buf.rows) * this.reactCallbag.state.screen.scaleY) / 2);
  } else {
    x = cX - parseFloat(firstGridOffset.left);
    y = cY - parseFloat(firstGridOffset.top);
  }
  var col = Math.floor(x / (this.reactCallbag.state.screen.chw * this.reactCallbag.state.screen.scaleX));
  var row = Math.floor(y / (this.reactCallbag.state.screen.chh * this.reactCallbag.state.screen.scaleY));

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
  if (!this.conn || this.reactCallbag.state.connection !== 1)
    return;

  // disable auto update pushthread if any command is issued;
  this.reactCallbag.onDisableLiveHelper();

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

App.prototype.onMouse_move = function(cX, cY) {
  var pos = this.clientToPos(cX, cY);
  this.buf.onMouse_move(pos.col, pos.row, false);
};

App.prototype.resetMouseCursor = function(cX, cY) {
  this.buf.BBSWin.style.cursor = 'auto';
  this.buf.mouseCursor = 11;
};

App.prototype.checkClass = function(cn) {
  return (  cn.indexOf("closeSI") >= 0  || cn.indexOf("EPbtn") >= 0 || 
      cn.indexOf("closePP") >= 0 || cn.indexOf("picturePreview") >= 0 || 
      cn.indexOf("drag") >= 0    || cn.indexOf("floatWindowClientArea") >= 0 || 
      cn.indexOf("WinBtn") >= 0  || cn.indexOf("sBtn") >= 0 || 
      cn.indexOf("nonspan") >= 0 || cn.indexOf("nomouse_command") >= 0);
};

App.prototype.mouse_click = function(e) {
  var skipMouseClick = (this.CmdHandler.getAttribute('SkipMouseClick') == '1');
  this.CmdHandler.setAttribute('SkipMouseClick','0');

  if (e.button == 2) { //right button
  } else if (e.button === 0) { //left button
    if ($(e.target).is('a') || $(e.target).parent().is('a')) {
      return;
    }
    if (window.getSelection().isCollapsed) { //no anything be select
      if (this.reactCallbag.state.settings.useMouseBrowsing) {
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
          this.reactCallbag.onManualFocusInput();
        }
      } else if (this.reactCallbag.state.settings.mouseLeftFunction) {
        if (this.reactCallbag.state.settings.mouseLeftFunction == 1) {
          if (this.easyReading._enabled && this.buf.startedEasyReading) {
            if (this.view.mainDisplay.scrollTop >= this.view.mainContainer.clientHeight - this.view.chh * this.buf.rows) {
              this.easyReading.leaveCurrentPost();
              this.conn.send('\r');
            } else {
              this.view.mainDisplay.scrollTop += this.view.chh;
            }
          } else {
            this.conn.send('\r');
          }
          e.preventDefault();
          this.reactCallbag.onManualFocusInput();
        } else if (this.reactCallbag.state.settings.mouseLeftFunction == 2) {
          if (this.easyReading._enabled && this.buf.startedEasyReading) {
            if (this.view.mainDisplay.scrollTop >= this.view.mainContainer.clientHeight - this.view.chh * this.buf.rows) {
              this.easyReading.leaveCurrentPost();
              this.conn.send('\x1b[C');
            } else {
              this.view.mainDisplay.scrollTop += this.view.chh * this.easyReading._turnPageLines;
            }
          } else {
            this.conn.send('\x1b[C');
          }
          e.preventDefault();
          this.reactCallbag.onManualFocusInput();
        }
      }
    }
  } else if (e.button == 1) { //middle button
  } else {
  }
};

App.prototype.mouse_up = function(e) {
  //0=left button, 1=middle button, 2=right button
  if (e.button === 0) {
    this.setMbTimer();
    this.mouseLeftButtonDown = false;
  } else if (e.button == 2) {
    this.mouseRightButtonDown = false;
  }

  if (e.button === 0 || e.button == 2) { //left or right button
    if (window.getSelection().isCollapsed) { //no anything be select
      if (this.reactCallbag.state.settings.useMouseBrowsing)
        this.onMouse_move(e.clientX, e.clientY);

      this.reactCallbag.onManualFocusInput();
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
      if (this.reactCallbag.state.settings.copyOnSelect) {
        this.doCopy(window.getSelection().toString().replace(/\u00a0/g, " "));
      }
    }
  } else {
    this.reactCallbag.onManualFocusInput();
    e.preventDefault();
  }
  var _this = this;
  this.inputAreaFocusTimer = setTimer(false, function() {
    clearTimeout(_this.inputAreaFocusTimer);
    _this.inputAreaFocusTimer = null;
    if (window.getSelection().isCollapsed)
      _this.reactCallbag.onManualFocusInput();
  }, 10);
};

App.prototype.mouse_move = function(e) {
  if (this.reactCallbag.state.settings.useMouseBrowsing) {
    if (window.getSelection().isCollapsed) {
      if(!this.mouseLeftButtonDown)
        this.onMouse_move(e.clientX, e.clientY);
    } else
      this.resetMouseCursor();
  }

};

App.prototype.mouse_scroll = function(e) {
  // if in easyreading, use it like webpage
  if (this.easyReading._enabled && this.buf.pageState == 3) {
    return;
  }
  const isScrollingUp = e.deltaY < 0 || e.wheelDelta > 0;

  // scroll = up/down
  // hold right mouse key + scroll = page up/down
  // hold left mouse key + scroll = thread prev/next
  var mouseWheelActionsUp = [ 'none', 'doArrowUp', 'doPageUp', 'previousThread' ];
  var mouseWheelActionsDown = [ 'none', 'doArrowDown', 'doPageDown', 'nextThread' ];

  if (isScrollingUp) {
    if (this.mouseRightButtonDown) {
      var action = mouseWheelActionsUp[this.reactCallbag.state.settings.mouseWheelFunction2];
      this.setBBSCmd(action);
    } else if (this.mouseLeftButtonDown) {
      var action = mouseWheelActionsUp[this.reactCallbag.state.settings.mouseWheelFunction3];
      this.setBBSCmd(action);
    } else {
      var action = mouseWheelActionsUp[this.reactCallbag.state.settings.mouseWheelFunction1];
      this.setBBSCmd(action);
    }
  } else { // scrolling down
    if (this.mouseRightButtonDown) {
      var action = mouseWheelActionsDown[this.reactCallbag.state.settings.mouseWheelFunction2];
      this.setBBSCmd(action);
    } else if (this.mouseLeftButtonDown) {
      var action = mouseWheelActionsDown[this.reactCallbag.state.settings.mouseWheelFunction3];
      this.setBBSCmd(action);
    } else {
      var action = mouseWheelActionsDown[this.reactCallbag.state.settings.mouseWheelFunction1];
      this.setBBSCmd(action);
    }
  }
  

  e.stopPropagation();
  e.preventDefault();

  if (this.mouseRightButtonDown) //prevent context menu popup
    this.CmdHandler.setAttribute('doDOMMouseScroll','1');
  if (this.mouseLeftButtonDown) {
    if (this.reactCallbag.state.settings.useMouseBrowsing) {
      this.CmdHandler.setAttribute('SkipMouseClick','1');
    }
  }
};

App.prototype.setBBSCmd = function setBBSCmd(cmd) {
  switch (cmd) {
    case "doArrowUp":
      if (this.easyReading._enabled && this.buf.startedEasyReading) {
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
      if (this.easyReading._enabled && this.buf.startedEasyReading) {
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
      if (this.easyReading._enabled && this.buf.startedEasyReading) {
        this.view.mainDisplay.scrollTop -= this.view.chh * this.easyReading._turnPageLines;
      } else {
        this.conn.send('\x1b[5~');
      }
      break;
    case "doPageDown":
      if (this.easyReading._enabled && this.buf.startedEasyReading) {
        this.view.mainDisplay.scrollTop += this.view.chh * this.easyReading._turnPageLines;
      } else {
        this.conn.send('\x1b[6~');
      }
      break;
    case "previousThread":
      if (this.easyReading._enabled && this.buf.startedEasyReading) {
        this.easyReading.leaveCurrentPost();
        this.conn.send('[');
      } else if (this.buf.pageState==2 || this.buf.pageState==3 || this.buf.pageState==4) {
        this.conn.send('[');
      }
      break;
    case "nextThread":
      if (this.easyReading._enabled && this.buf.startedEasyReading) {
        this.easyReading.leaveCurrentPost();
        this.conn.send(']');
      } else if (this.buf.pageState==2 || this.buf.pageState==3 || this.buf.pageState==4) {
        this.conn.send(']');
      }
      break;
    default:
      break;
  }
}
