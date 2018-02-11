// Terminal View

import { TermKeyboard } from './term_keyboard';
import { termInvColors } from './term_buf';
import { renderRowHtml } from './term_ui';

import { i18n } from './i18n';
import { setTimer } from './util';
import { wrapText, u2b, parseStatusRow } from './string_util';

const DBCS_DETECT = true;

export function TermView(bbscore) {
  //new pref - start
  this.charset = 'big5';
  //this.highlightFG = 7;
  //new pref - end

  this.buf = null;
  this.bbscore = bbscore;
  this.page = null;


  // TODO Move this into easy_reading.js
  this.easyReadingKeyDownKeyCode = 0;


  this.actualRowIndex = 0;


  //this.DBDetection = false;

  



  Object.defineProperty(this, 'mainContainer', {
    get() { return $('.View__Container')[0] },
  });
  Object.defineProperty(this, 'mainDisplay', {
    get() { return $('.View__Main')[0] },
  });
  Object.defineProperty(this, 'lastRowDiv', {
    get() { return $('.View__EasyReadingRow--last')[0] },
  });
  Object.defineProperty(this, 'replyRowDiv', {
    get() { return $('.View__EasyReadingRow--reply')[0] },
  });



  


  this._keyboard = new TermKeyboard(
    this.checkLeftDB.bind(this),
    this.checkCurDB.bind(this),
    this._send.bind(this));
}


TermView.prototype = {

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
      var {chh, chw} = this.bbscore.reactCallbag.state.screen;
      // resets color
      var line = lines[row];
      var lineChanged = lineChangeds[row];
      if (lineChanged === false && !force)
        continue;
      var lineUpdated = false;

      for (var curCol = 0; curCol < cols; ++curCol) {
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
      if (this.bbscore.easyReading._enabled) {
        if (this.buf.startedEasyReading && this.buf.easyReadingShowReplyText) {
          this.updateEasyReadingReplyRow(changedLineHtmlStrs[changedLineHtmlStrs.length-1]);
        } else if (this.buf.startedEasyReading && this.buf.easyReadingShowPushInitText) {
          this.updateEasyReadingPushInitRow(changedLineHtmlStrs[changedLineHtmlStrs.length-1]);
        } else {
          this.populateEasyReadingPage();
        }
      } else {
        this.bbscore.reactCallbag.onLines(
          /* For Screen#componentWillReceiveProps */lines.slice()
        );
      }
      this.buf.prevPageState = this.buf.pageState;
    }
    //var time = new Date().getTime() - start;
    //console.log(time);

  },

  onTextInput: function(text) {
    this._convSend(text);
  },

  checkLeftDB: function() {
    if (DBCS_DETECT && this.buf.cur_x>1) {
      var lines = this.buf.lines;
      var line = lines[this.buf.cur_y];
      var ch = line[this.buf.cur_x-2];
      if (ch.isLeadByte)
        return true;
    }
    return false;
  },

  checkCurDB: function() {
    if (DBCS_DETECT) {// && this.buf.cur_x<this.buf.cols-2){
      var lines = this.buf.lines;
      var line = lines[this.buf.cur_y];
      var ch = line[this.buf.cur_x];
      if (ch.isLeadByte)
        return true;
    }
    return false;
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

  populateEasyReadingPage: function() {
    if (this.buf.pageState == 3 && this.buf.prevPageState == 3) {
      console.groupCollapsed('populateEasyReadingPage')
      console.log('this.buf.lines', this.buf.lines)
      console.log('this.buf.pageLines', this.buf.pageLines)
      console.log('this.buf.pageWrappedLines', this.buf.pageWrappedLines)
      console.groupEnd('populateEasyReadingPage')
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
  },

  appendRows: function(lines, showsLinkPreview) {
    for (var i in lines) {
      var line = lines[i];
      var el = document.createElement('span');
      el.setAttribute('type', 'bbsrow');
      el.setAttribute('srow', this.mainContainer.childNodes.length);
      this.mainContainer.appendChild(el);
      renderRowHtml(
        line, this.mainContainer.childNodes.length, this.bbscore.reactCallbag.state.screen.chh,
        showsLinkPreview, el);
    }
  },

  renderSingleRow: function(target, row) {
    var el = document.createElement('span');
    el.setAttribute('type', 'bbsrow');
    el.setAttribute('srow', '0');
    target.appendChild(el);
    return renderRowHtml(row, 0, this.bbscore.reactCallbag.state.screen.chh, false, el);
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
