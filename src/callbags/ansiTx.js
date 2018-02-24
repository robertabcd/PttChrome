import { map } from "callbag-basics";

const STATE_TEXT = 0;
const STATE_ESC = 1;
const STATE_CSI = 2;
const STATE_C1 = 3;

const C1_Char = [" ", "#", "%", "(", ")", "*", "+", "-", ".", "/"];

export const makeMapSource = () => {
  let ansiState = STATE_TEXT;
  let esc = "";

  return map(str => {
    const result = [];
    let s = "";
    for (let i = 0; i < str.length; ++i) {
      const ch = str[i];
      switch (ansiState) {
        case STATE_TEXT:
          switch (ch) {
            case "\x1b":
              if (s) {
                result.push({
                  type: ACTION_PUTS,
                  data: s,
                });
                s = "";
              }
              ansiState = STATE_ESC;
              break;
            default:
              s += ch;
          }
          break;
        case STATE_CSI:
          if ((ch >= "`" && ch <= "z") || (ch >= "@" && ch <= "Z")) {
            // if(ch !== 'm')
            //    dump('CSI: ' + esc + ch + '\n');
            const params = esc.split(";");
            let firstChar = "";
            if (params[0]) {
              if (params[0].charAt(0) < "0" || params[0].charAt(0) > "9") {
                firstChar = params[0].charAt(0);
                params[0] = params[0].slice(1);
              }
            }
            if (firstChar && ch !== "h" && ch !== "l") {
              // unknown CSI
              //dump('unknown CSI: ' + esc + ch + '\n');
              ansiState = STATE_TEXT;
              esc = "";
              break;
            }
            for (let j = 0; j < params.length; ++j) {
              if (params[j]) {
                params[j] = parseInt(params[j], 10);
              } else {
                params[j] = 0;
              }
            }
            switch (ch) {
              case "m":
                result.push({
                  type: ACTION_ASSIGN_PARAMS_TO_ATTRS,
                  data: params,
                });
                break;
              case "@":
                result.push({
                  type: ACTION_INSERT,
                  data: params[0] > 0 ? params[0] : 1,
                });
                break;
              case "A":
                result.push({
                  type: ACTION_GOTO_POS,
                  data: {
                    deltaY: -1 * (params[0] ? params[0] : 1),
                  },
                });
                break;
              case "B":
              case "e":
                result.push({
                  type: ACTION_GOTO_POS,
                  data: {
                    deltaY: params[0] ? params[0] : 1,
                  },
                });
                break;
              case "C":
              case "e":
                result.push({
                  type: ACTION_GOTO_POS,
                  data: {
                    deltaX: params[0] ? params[0] : 1,
                  },
                });
                break;
              case "D":
                result.push({
                  type: ACTION_GOTO_POS,
                  data: {
                    deltaX: -1 * (params[0] ? params[0] : 1),
                  },
                });
                break;
              case "E":
                result.push({
                  type: ACTION_GOTO_POS,
                  data: {
                    x: 0,
                    deltaY: params[0] ? params[0] : 1,
                  },
                });
                break;
              case "F":
                result.push({
                  type: ACTION_GOTO_POS,
                  data: {
                    x: 0,
                    deltaY: -1 * (params[0] ? params[0] : 1),
                  },
                });
                break;
              case "G":
              case "`":
                result.push({
                  type: ACTION_GOTO_POS,
                  data: {
                    deltaX: params[0] > 0 ? params[0] - 1 : 0,
                  },
                });
                break;
              case "I":
                result.push({
                  type: ACTION_TAB,
                  data: params[0] > 0 ? params[0] : 1,
                });
                break;
              case "d":
                result.push({
                  type: ACTION_GOTO_POS,
                  data: {
                    deltaY: params[0] > 0 ? params[0] - 1 : 0,
                  },
                });
                break;
              /*
              case 'h':
                if (firstChar === '?') {
                  var mainobj = term.view.conn.listener;
                  switch(params[0]) {
                  case 1:
                    term.view.cursorAppMode = true;
                    break;
                  case 1048:
                  case 1049:
                    term.cur_x_sav = term.cur_x;
                    term.cur_y_sav = term.cur_y;
                    if (params[0] !== 1049) break; // 1049 fall through
                  case 47:
                  case 1047:
                    mainobj.selAll(true); // skipRedraw
                    term.altScreen=mainobj.ansiCopy(true); // external buffer
                    term.altScreen+=term.ansiCmp(TermChar.newChar, term.attr);
                    term.clear(2);
                    term.attr.resetAttr();
                    break;
                  default:
                  }
                }
                break;
              case 'l':
                if (firstChar === '?') {
                  switch (params[0]) {
                  case 1:
                    term.view.cursorAppMode = false;
                    break;
                  case 47:
                  case 1047:
                  case 1049:
                    term.clear(2);
                    term.attr.resetAttr();
                    if (term.altScreen) {
                      ansiState = STATE_TEXT;
                      esc = '';
                      this.feed(term.altScreen.replace(/(\r\n)+$/g, '\r\n'));
                    }
                    term.altScreen='';
                    if (params[0] !== 1049) break; // 1049 fall through
                  case 1048:
                    if (term.cur_x_sav<0 || term.cur_y_sav<0) break;
                    term.cur_x = term.cur_x_sav;
                    term.cur_y = term.cur_y_sav;
                    break;
                  default:
                  }
                }
                break;
              */
              case "J":
                result.push({
                  type: ACTION_CLEAR,
                  data: params ? params[0] : 0,
                });
                break;
              case "H":
              case "f":
                if (params.length < 2) {
                  result.push({
                    type: ACTION_GOTO_POS,
                    data: {
                      x: 0,
                      y: 0,
                    },
                  });
                } else {
                  result.push({
                    type: ACTION_GOTO_POS,
                    data: {
                      x: params[1] > 0 ? params[1] - 1 : params[1],
                      y: params[0] > 0 ? params[0] - 1 : params[0],
                    },
                  });
                }
                break;
              case "K":
                result.push({
                  type: ACTION_ERASE_LINE,
                  data: params ? params[0] : 0,
                });
                break;
              case "L":
                result.push({
                  type: ACTION_INSERT_LINE,
                  data: params[0] > 0 ? params[0] : 1,
                });
                break;
              case "M":
                result.push({
                  type: ACTION_DELETE_LINE,
                  data: params[0] > 0 ? params[0] : 1,
                });
                break;
              case "P":
                result.push({
                  type: ACTION_DEL,
                  data: params[0] > 0 ? params[0] : 1,
                });
                break;
              case "r": // FIXME: scroll range
                result.push({
                  type: ACTION_FIXME_SCROLL_RANGE,
                  data: params,
                });
                break;
              case "s":
                result.push({
                  type: ACTION_FIXME_SAVE_CUR_POS,
                });
                break;
              case "u":
                result.push({
                  type: ACTION_FIXME_RESTORE_CUR_POS,
                });
                break;
              case "S":
                result.push({
                  type: ACTION_SCROLL,
                  data: [false, params[0] > 0 ? params[0] : 1],
                });
                break;
              case "T":
                result.push({
                  type: ACTION_SCROLL,
                  data: [true, params[0] > 0 ? params[0] : 1],
                });
                break;
              case "X":
                result.push({
                  type: ACTION_ERASE_CHAR,
                  data: params[0] > 0 ? params[0] : 1,
                });
                break;
              case "Z":
                result.push({
                  type: ACTION_BACK_TAB,
                  data: params[0] > 0 ? params[0] : 1,
                });
                break;
              default:
              //dump('unknown CSI: ' + esc + ch + '\n');
            }
            ansiState = STATE_TEXT;
            esc = "";
          } else {
            esc += ch;
          }
          break;
        case STATE_C1:
          let C1_End = true;
          if (esc) {
            // multi-char is not supported now
            C1_End = C1_Char.indexOf(esc) === -1;
            if (C1_End) {
              --i;
            } else {
              esc += ch;
            }
            //dump('UNKNOWN C1 CONTROL CHAR IS FOUND: ' + esc + '\n');
            esc = "";
            ansiState = STATE_TEXT;
            break;
          }
          switch (ch) {
            case "7":
              result.push({
                type: ACTION_FIXME_SAVE_CUR_POS,
              });
              break;
            case "8":
              result.push({
                type: ACTION_FIXME_RESTORE_CUR_POS,
              });
              break;
            case "D":
              result.push({
                type: ACTION_SCROLL,
                data: [false, 1],
              });
              break;
            case "E":
              result.push({
                type: ACTION_LINE_FEED_AND_CARRAGE_RETURN,
              });
              break;
            case "M":
              result.push({
                type: ACTION_SCROLL,
                data: [true, 1],
              });
              break;
            /*
            case '=':
              term.view.keypadAppMode = true;
              break;
            case '>':
              term.view.keypadAppMode = false;
              break;
            */
            default:
              esc += ch;
              C1_End = false;
          }
          if (!C1_End) {
            break;
          }
          esc = "";
          ansiState = STATE_TEXT;
          break;
        case STATE_ESC:
          if (ch === "[") {
            ansiState = STATE_CSI;
          } else {
            ansiState = STATE_C1;
            --i;
          }
          break;
      }
    }
    if (s) {
      result.push({
        type: ACTION_PUTS,
        data: s,
      });
      s = "";
    }
    return result;
  });
};

// action
export const ACTION_PUTS = Symbol.for("ACTION_PUTS");
export const ACTION_ASSIGN_PARAMS_TO_ATTRS = Symbol.for(
  "ACTION_ASSIGN_PARAMS_TO_ATTRS"
);
export const ACTION_INSERT = Symbol.for("ACTION_INSERT");
export const ACTION_GOTO_POS = Symbol.for("ACTION_GOTO_POS");
export const ACTION_TAB = Symbol.for("ACTION_TAB");
export const ACTION_CLEAR = Symbol.for("ACTION_CLEAR");
export const ACTION_ERASE_LINE = Symbol.for("ACTION_ERASE_LINE");
export const ACTION_INSERT_LINE = Symbol.for("ACTION_INSERT_LINE");
export const ACTION_DELETE_LINE = Symbol.for("ACTION_DELETE_LINE");
export const ACTION_DEL = Symbol.for("ACTION_DEL");
export const ACTION_FIXME_SCROLL_RANGE = Symbol.for(
  "ACTION_FIXME_SCROLL_RANGE"
);
export const ACTION_FIXME_SAVE_CUR_POS = Symbol.for(
  "ACTION_FIXME_SAVE_CUR_POS"
);
export const ACTION_FIXME_RESTORE_CUR_POS = Symbol.for(
  "ACTION_FIXME_RESTORE_CUR_POS"
);
export const ACTION_SCROLL = Symbol.for("ACTION_SCROLL");
export const ACTION_ERASE_CHAR = Symbol.for("ACTION_ERASE_CHAR");
export const ACTION_BACK_TAB = Symbol.for("ACTION_BACK_TAB");
export const ACTION_LINE_FEED_AND_CARRAGE_RETURN = Symbol.for(
  "ACTION_LINE_FEED_AND_CARRAGE_RETURN"
);
