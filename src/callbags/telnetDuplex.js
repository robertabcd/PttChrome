import { pipe, map, filter } from "callbag-basics";
import { u2b, ansiHalfColorConv } from "../js/string_util";

// Telnet commands
const SE = "\xf0";
const NOP = "\xf1";
const DATA_MARK = "\xf2";
const BREAK = "\xf3";
const INTERRUPT_PROCESS = "\xf4";
const ABORT_OUTPUT = "\xf5";
const ARE_YOU_THERE = "\xf6";
const ERASE_CHARACTER = "\xf7";
const ERASE_LINE = "\xf8";
const GO_AHEAD = "\xf9";
const SB = "\xfa";

// Option commands
const WILL = "\xfb";
const WONT = "\xfc";
const DO = "\xfd";
const DONT = "\xfe";
const IAC = "\xff";

// Telnet options
const ECHO = "\x01";
const SUPRESS_GO_AHEAD = "\x03";
const TERM_TYPE = "\x18";
const IS = "\x00";
const SEND = "\x01";
const NAWS = "\x1f";

// state
const STATE_DATA = 0;
const STATE_IAC = 1;
const STATE_WILL = 2;
const STATE_WONT = 3;
const STATE_DO = 4;
const STATE_DONT = 5;
const STATE_SB = 6;

export const makeMapSource = ({ telnetSubject, termType = "VT100" } = {}) => {
  let telnetState = STATE_DATA;
  let iac_sb = "";

  return map(str => {
    const result = [];
    let data = "";
    for (let i = 0; i < str.length; ++i) {
      const ch = str[i];
      switch (telnetState) {
        case STATE_DATA:
          if (ch === IAC) {
            if (data) {
              result.push(data);
              data = "";
            }
            telnetState = STATE_IAC;
          } else {
            data += ch;
          }
          break;
        case STATE_IAC:
          switch (ch) {
            case WILL:
              telnetState = STATE_WILL;
              break;
            case WONT:
              telnetState = STATE_WONT;
              break;
            case DO:
              telnetState = STATE_DO;
              break;
            case DONT:
              telnetState = STATE_DONT;
              break;
            case SB:
              telnetState = STATE_SB;
              break;
            default:
              telnetState = STATE_DATA;
          }
          break;
        case STATE_WILL:
          switch (ch) {
            case ECHO:
            case SUPRESS_GO_AHEAD:
              telnetSubject(1, {
                type: ACTION_SEND,
                data: IAC + DO + ch,
              });
              break;
            default:
              telnetSubject(1, {
                type: ACTION_SEND,
                data: IAC + DONT + ch,
              });
          }
          telnetState = STATE_DATA;
          break;
        case STATE_DO:
          switch (ch) {
            case TERM_TYPE:
              telnetSubject(1, {
                type: ACTION_SEND,
                data: IAC + WILL + ch,
              });
              break;
            case NAWS:
              // Don't respond.
              // sink(1, {
              //   type: ACTION_SEND,
              //   data:  IAC + WILL + ch
              // })
              //sendNaws();
              break;
            default:
              telnetSubject(1, {
                type: ACTION_SEND,
                data: IAC + WONT + ch,
              });
          }
          telnetState = STATE_DATA;
          break;
        case STATE_DONT:
        case STATE_WONT:
          telnetState = STATE_DATA;
          break;
        case STATE_SB: // sub negotiation
          iac_sb += ch;
          if (iac_sb.slice(-2) === IAC + SE) {
            // end of sub negotiation
            switch (iac_sb[0]) {
              case TERM_TYPE:
                // FIXME: support other terminal types
                //var termType = app.__prefs__.TermType;
                telnetSubject(1, {
                  type: ACTION_SEND,
                  data: IAC + SB + TERM_TYPE + IS + termType + IAC + SE,
                });
                break;
            }
            telnetState = STATE_DATA;
            iac_sb = "";
            break;
          }
      }
      if (data) {
        result.push(data);
        data = "";
      }
    }
    return result.join("");
  });
};

// action
export const ACTION_SEND = Symbol.for("ACTION_SEND");
export const ACTION_CONV_SEND = Symbol.for("ACTION_CONV_SEND");

export const mapSink = source =>
  pipe(
    source,
    map(({ type, data }) => {
      switch (type) {
        case ACTION_CONV_SEND: {
          // supports UAO
          // when converting unicode to big5, use UAO.
          const s = u2b(data);
          // detect ;50m (half color) and then convert accordingly
          if (s) {
            return ansiHalfColorConv(s);
          }
          break;
        }
        case ACTION_SEND:
        default:
          return data;
      }
    }),
    filter(it => it)
  );
