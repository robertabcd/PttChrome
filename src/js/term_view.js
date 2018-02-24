// Terminal View

import { termInvColors } from './term_buf';

import { i18n } from './i18n';
import { setTimer } from './util';
import { wrapText, u2b, parseStatusRow } from './string_util';
import { INIT_ER_LINES, APPEND_ER_LINES, CHANGE_LINES, UPDATE_ER_ACTION_LINE } from '../application/callbagDuplex';


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

  



  Object.defineProperty(this, 'mainDisplay', {
    get() { return $('.View__Main')[0] },
  });



  

}


TermView.prototype = {

  setBuf: function(buf) {
    this.buf=buf;
  },

  update: function() {
    this.redraw(false);
  },

  redraw: function(force) {
    console.log(`redraw(${force})`/*, this.buf.changedDueTo */);

    var cols = this.buf.cols;
    var rows = this.buf.rows;
    
  
    if (this.bbscore.easyReading._enabled) {
      if (this.buf.startedEasyReading && this.buf.easyReadingShowReplyText) {
        this.bbscore.dispatch({
          type: UPDATE_ER_ACTION_LINE,
          data: this.buf.lines[this.buf.lines.length-2],
        });
      } else if (this.buf.startedEasyReading && this.buf.easyReadingShowPushInitText) {
        this.bbscore.dispatch({
          type: UPDATE_ER_ACTION_LINE,
          data: this.buf.lines[this.buf.lines.length-1],
        });
      } else {
        this.populateEasyReadingPage();
      }
    } else {
      this.bbscore.reactCallbag.onLines(
        /* For Screen#componentWillReceiveProps */this.buf.lines.slice()
      );
    }
    this.buf.prevPageState = this.buf.pageState;
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
        var rowOffset = this.bbscore.reactCallbag.state.screen.erLines.length-1;
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
        this.bbscore.dispatch({
          type: APPEND_ER_LINES,
          data: this.buf.lines.slice(beginIndex, -1)
        });
      }
      this.buf.prevPageState = 3;
    } else {
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
        this.bbscore.dispatch({
          type: INIT_ER_LINES,
          data: this.buf.lines.slice(0, -1)
        });
      } else {
        this.bbscore.dispatch({
          type: CHANGE_LINES,
          data: this.buf.lines.slice(),
        });
      }
      this.buf.prevPageState = this.buf.pageState;
    }
    const shouldCollapse = this.buf.pageWrappedLines[0] === undefined && this.buf.pageWrappedLines.slice(1).every(it => it === 1);
    console[shouldCollapse ? 'groupCollapsed' : 'group']('populateEasyReadingPage')
    console.log('shouldCollapse', shouldCollapse)
    console.log('this.buf.lines', this.buf.lines)
    console.log('this.buf.pageWrappedLines', this.buf.pageWrappedLines.slice())
    console.groupEnd('populateEasyReadingPage')
  },
};
