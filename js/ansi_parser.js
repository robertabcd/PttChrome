'use strict';
// Parser for ANSI escape sequence
(function() {

  var STATE_TEXT = 0;
  var STATE_ESC = 1;
  var STATE_CSI = 2;
  var STATE_C1 = 3;

  pttchrome.AnsiParser = function(buf) {
    this.buf = buf;
    this.state = STATE_TEXT;
    this.esc = '';

    // temp char for holding the attr
    this.attr = new TermChar(' ');
  };

  pttchrome.AnsiParser.prototype = {
    feed: function(data) {
      if (!this.buf)
        return;

      var s = '';

      for (var i = 0; i < data.length; ++i) {
        switch (this.state) {
          case STATE_TEXT:
            s = handleText(this, s, data[i]);
            break;
          case STATE_ESC:
            s = handleESC(this, s, data[i]);
            break;
          case STATE_CSI:
            s = handleCSI(this, s, data[i]);
            break;
          case STATE_C1:
            s = handleC1(this, s, data[i]);
            break;
        }
      }

      // flush any string leftovers
      if (s) {
        this.buf.puts(s, this.attr);
      }
    }
  };


  function handleText(p, s, ch) {
    if (ch === '\x1b') {
      // found esc
      // push whatever we have in s so far and switch state
      if (s) {
        p.buf.puts(s, p.attr);
        s = '';
      }
      p.state = STATE_ESC;
    } else {
      s += ch;
    }
    
    return s;
  }

  function handleESC(p, s, ch) {
    if (ch == '[') {
      p.state = STATE_CSI;
    } else {
      p.state = STATE_C1;
      --i;
    }

    return s;
  }

  function handleCSIm(params, attr) {
    for (var n_params = params.length; n_params; --n_params){
      var v = params.shift();
      switch (v) {
        case 0: // reset
          attr.resetAttr();
          break;
        case 1: // bright
          attr.bright=true;
          break;
        case 4:
          attr.underLine=true;
          break;
        case 5: // blink
        case 6:
          attr.blink=true;
          break;
        case 7: // invert
          attr.invert=true;
          break;
        case 8:
          // invisible is not supported
          break;
        /*
        case 22: // normal, or not bright
          attr.bright=false;
          break;
        case 24: // not underlined
          attr.underLine=false;
          break;
        case 25: // steady, or not blink
          attr.blink=false;
          break;
        case 27: // positive, or not invert
          attr.invert=false;
          break;
        */
        default:
          if (v <= 37 && v >= 30) { // fg
            attr.fg = v - 30;
          } else if (v >= 40 && v <= 47) { // bg
            attr.bg = v - 40;
          }
          break;
      }
    }
  }

  function handleCSI(p, s, ch) {
    var buf = p.buf;
    if ( (ch < '`' || ch > 'z') && (ch < '@' || ch > 'Z') ) {
      p.esc += ch;
      return s;
    }

    // if(ch != 'm')
    //    dump('CSI: ' + p.esc + ch + '\n');
    var params = p.esc.split(';');
    var firstChar = '';
    if (params[0] && 
        (params[0].charAt(0) < '0' || params[0].charAt(0) > '9')) {
      firstChar = params[0].charAt(0);
      params[0] = params[0].slice(1);
    }
    if (firstChar && ch != 'h' && ch != 'l') { // unknown CSI
      //dump('unknown CSI: ' + p.esc + ch + '\n');
      p.state = STATE_TEXT;
      p.esc = '';
      return s;
    }

    for (var j = 0; j < params.length; ++j) {
      var val = parseInt(params[j], 10);
      params[j] = val ? val : 0;
    }

    var param0Val = (params[0] > 0 ? params[0]:1);
    switch (ch) {
      case 'm':
        handleCSIm(params, p.attr);
        break;
      case '@':
        buf.insert(param0Val);
        break;
      case 'A':
        buf.gotoPos(buf.cur_x, buf.cur_y-param0Val);
        break;
      case 'B':
      case 'e':
        buf.gotoPos(buf.cur_x, buf.cur_y+param0Val);
        break;
      case 'C':
      case 'e':
        buf.gotoPos(buf.cur_x+param0Val, buf.cur_y);
        break;
      case 'D':
        buf.gotoPos(buf.cur_x-param0Val, buf.cur_y);
        break;
      case 'E':
        buf.gotoPos(0, buf.cur_y+param0Val);
        break;
      case 'F':
        buf.gotoPos(0, buf.cur_y-param0Val);
        break;
      case 'G':
      case '`':
        buf.gotoPos(param0Val-1, buf.cur_y);
        break;
      case 'I':
        buf.tab(param0Val);
        break;
      case 'd':
        buf.gotoPos(buf.cur_x, param0Val-1);
        break;
      /*
      case 'h':
        if (firstChar == '?') {
          var mainobj = buf.view.conn.listener;
          switch(params[0]) {
          case 1:
            buf.view.cursorAppMode = true;
            break;
          case 1048:
          case 1049:
            buf.cur_x_sav = buf.cur_x;
            buf.cur_y_sav = buf.cur_y;
            if (params[0] != 1049) break; // 1049 fall through
          case 47:
          case 1047:
            mainobj.selAll(true); // skipRedraw
            buf.altScreen=mainobj.ansiCopy(true); // external buffer
            buf.altScreen+=buf.ansiCmp(buf.newChar, p.attr);
            buf.clear(2);
            p.attr.resetAttr();
            break;
          default:
          }
        }
        break;
      case 'l':
        if (firstChar == '?') {
          switch (params[0]) {
          case 1:
            buf.view.cursorAppMode = false;
            break;
          case 47:
          case 1047:
          case 1049:
            buf.clear(2);
            p.attr.resetAttr();
            if (buf.altScreen) {
              p.state = ANSI_PARSER_STATE_TEXT;
              p.esc = '';
              p.feed(buf.altScreen.replace(/(\r\n)+$/g, '\r\n'));
            }
            buf.altScreen='';
            if (params[0] != 1049) break; // 1049 fall through
          case 1048:
            if (buf.cur_x_sav<0 || buf.cur_y_sav<0) break;
            buf.cur_x = buf.cur_x_sav;
            buf.cur_y = buf.cur_y_sav;
            break;
          default:
          }
        }
        break;
      */
      case 'J':
        buf.clear(params ? params[0] : 0);
        break;
      case 'H':
      case 'f':
        if (params.length < 2) {
          buf.gotoPos(0, 0);
        } else {
          if (params[0] > 0)
            --params[0];
          if (params[1] > 0)
            --params[1];
          buf.gotoPos(params[1], params[0]);
        }
        break;
      case 'K':
        buf.eraseLine(params? params[0] : 0);
        break;
      case 'L':
        buf.insertLine(param0Val);
        break;
      case 'M':
        buf.deleteLine(param0Val);
        break;
      case 'P':
        buf.del(param0Val);
        break;
      case 'r': // FIXME: scroll range
        if (params.length < 2) {
          buf.scrollStart=0;
          buf.scrollEnd=buf.rows-1;
        } else {
          if (params[0] > 0)
            --params[0];
          if (params[1] > 0)
            --params[1];
          buf.scrollStart = params[0];
          buf.scrollEnd = params[1];
        }
        break;
      case 's':
        buf.cur_x_sav=buf.cur_x;
        buf.cur_y_sav=buf.cur_y;
        break;
      case 'u':
        if (buf.cur_x_sav >= 0 && buf.cur_y_sav >= 0) {
          buf.cur_x = buf.cur_x_sav;
          buf.cur_y = buf.cur_y_sav;
        }
        break;
      case 'S':
        buf.scroll(false, param0Val);
        break;
      case 'T':
        buf.scroll(true, param0Val);
        break;
      case 'X':
        buf.eraseChar(param0Val);
        break;
      case 'Z':
        buf.backTab(param0Val);
        break;
      default:
        //dump('unknown CSI: ' + p.esc + ch + '\n');
    }
    p.state = STATE_TEXT;
    p.esc = '';

    return s;
  }

  function handleC1(p, s, ch) {
    var c1End = true;
    var c1Char = [' ', '#', '%', '(', ')', '*', '+', '-', '.', '/'];
    var buf = p.buf;

    if (p.esc) { // multi-char is not supported now
      // c1End is false if p.esc is any of c1Char
      c1End = (c1Char.indexOf(p.esc) == -1);
      if (c1End) {
        --i;
      } else {
        p.esc += ch;
      }
      //dump('UNKNOWN C1 CONTROL CHAR IS FOUND: ' + p.esc + '\n');
      p.esc = '';
      p.state = STATE_TEXT;
      return s;
    }

    switch (ch) {
      case '7':
        buf.cur_x_sav = buf.cur_x;
        buf.cur_y_sav = buf.cur_y;
        break;
      case '8':
        if (buf.cur_x_sav >= 0 && buf.cur_y_sav >= 0) {
          buf.cur_x = buf.cur_x_sav;
          buf.cur_y = buf.cur_y_sav;
        }
        break;
      case 'D':
        buf.scroll(false, 1);
        break;
      case 'E':
        buf.lineFeed();
        buf.carriageReturn();
        break;
      case 'M':
        buf.scroll(true, 1);
        break;
      /*
      case '=':
          buf.view.keypadAppMode = true;
          break;
      case '>':
          buf.view.keypadAppMode = false;
          break;
      */
      default:
        p.esc += ch;
        c1End = false;
    }

    if (!c1End) {
      return s;
    }

    p.esc = '';
    p.state = STATE_TEXT;

    return s;
  }

})();
