// Handle Telnet Connections according to RFC 854

// Telnet commands
const SE = '\xf0';
const NOP = '\xf1';
const DATA_MARK = '\xf2';
const BREAK = '\xf3';
const INTERRUPT_PROCESS = '\xf4';
const ABORT_OUTPUT = '\xf5';
const ARE_YOU_THERE = '\xf6';
const ERASE_CHARACTER = '\xf7';
const ERASE_LINE = '\xf8';
const GO_AHEAD  = '\xf9';
const SB = '\xfa';

// Option commands
const WILL  = '\xfb';
const WONT  = '\xfc';
const DO = '\xfd';
const DONT = '\xfe';
const IAC = '\xff';

// Telnet options
const ECHO  = '\x01';
const SUPRESS_GO_AHEAD = '\x03';
const TERM_TYPE = '\x18';
const IS = '\x00';
const SEND = '\x01';
const NAWS = '\x1f';

// state
const STATE_DATA=0;
const STATE_IAC=1;
const STATE_WILL=2;
const STATE_WONT=3;
const STATE_DO=4;
const STATE_DONT=5;
const STATE_SB=6;

function TelnetConnection(socket) {
  this.socket = socket;
  this.socket.addEventListener('open', this._onOpen.bind(this));
  this.socket.addEventListener('data', this._onDataAvailable.bind(this));
  this.socket.addEventListener('close', this._onClose.bind(this));

  this.state = STATE_DATA;
  this.iac_sb = '';

  this.termType = 'VT100';
}

pttchrome.Event.mixin(TelnetConnection.prototype);

TelnetConnection.prototype._onOpen = function(e) {
  this.dispatchEvent(new CustomEvent('open'));
};

TelnetConnection.prototype._onClose = function(e) {
  this.dispatchEvent(new CustomEvent('close'));
};

TelnetConnection.prototype._onDataAvailable = function(e) {
  var str = e.detail.data;
  var data='';
  var count = str.length;
  while (count > 0) {
    var s = str;
    count -= s.length;
    var n = s.length;
    for (var i = 0; i < n; ++i) {
      var ch = s[i];
      switch (this.state) {
      case STATE_DATA:
        if( ch == IAC ) {
          if (data) {
            this._dispatchData(data);
            data='';
          }
          this.state = STATE_IAC;
        } else {
          data += ch;
        }
        break;
      case STATE_IAC:
        switch (ch) {
        case WILL:
          this.state=STATE_WILL;
          break;
        case WONT:
          this.state=STATE_WONT;
          break;
        case DO:
          this.state=STATE_DO;
          break;
        case DONT:
          this.state=STATE_DONT;
          break;
        case SB:
          this.state=STATE_SB;
          break;
        default:
          this.state=STATE_DATA;
        }
        break;
      case STATE_WILL:
        switch (ch) {
        case ECHO:
        case SUPRESS_GO_AHEAD:
          this._sendRaw( IAC + DO + ch );
          break;
        default:
          this._sendRaw( IAC + DONT + ch );
        }
        this.state = STATE_DATA;
        break;
      case STATE_DO:
        switch (ch) {
        case TERM_TYPE:
          this._sendRaw( IAC + WILL + ch );
          break;
        case NAWS:
          // Don't respond.
          //this._sendRaw( IAC + WILL + ch );
          //this.sendNaws();
          break;
        default:
          this._sendRaw( IAC + WONT + ch );
        }
        this.state = STATE_DATA;
        break;
      case STATE_DONT:
      case STATE_WONT:
        this.state = STATE_DATA;
        break;
      case STATE_SB: // sub negotiation
        this.iac_sb += ch;
        if ( this.iac_sb.slice(-2) == IAC + SE ) {
          // end of sub negotiation
          switch (this.iac_sb[0]) {
          case TERM_TYPE: 
            // FIXME: support other terminal types
            //var termType = this.app.prefs.TermType;
            var rep = IAC + SB + TERM_TYPE + IS + this.termType + IAC + SE;
            this._sendRaw( rep );
            break;
          }
          this.state = STATE_DATA;
          this.iac_sb = '';
          break;
        }
      }
    }
    if (data) {
      this._dispatchData(data);
      data='';
    }
  }
};

TelnetConnection.prototype._dispatchData = function(data) {
  this.dispatchEvent(new CustomEvent('data', {
    detail: {
      data: data
    }
  }));
};

TelnetConnection.prototype.send = function(str) {
  // XXX Should do escape on IAC.
  this._sendRaw(str);
};

TelnetConnection.prototype._sendRaw = function(data) {
  if (data) {
    this.socket.send(data);
  }
}

TelnetConnection.prototype.convSend = function(unicode_str) {
  // supports UAO
  // when converting unicode to big5, use UAO.

  var s = unicode_str.u2b();
  // detect ;50m (half color) and then convert accordingly
  if (s) {
    s = s.ansiHalfColorConv();
    this._sendRaw(s);
  }
};

TelnetConnection.prototype.sendNaws = function(cols, rows) {
  var nawsStr = String.fromCharCode(Math.floor(cols/256), cols%256, Math.floor(rows/256), rows%256).replace(/(\xff)/g,'\xff\xff');
  var rep = IAC + SB + NAWS + nawsStr + IAC + SE;
  this._sendRaw( rep );
};
