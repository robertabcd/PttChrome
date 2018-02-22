import { pipe, map } from "callbag-basics";

import {
  ACTION_PUTS,
  ACTION_ASSIGN_PARAMS_TO_ATTRS,
  ACTION_INSERT,
  ACTION_GOTO_POS,
  ACTION_TAB,
  ACTION_CLEAR,
  ACTION_ERASE_LINE,
  ACTION_INSERT_LINE,
  ACTION_DELETE_LINE,
  ACTION_DEL,
  ACTION_FIXME_SCROLL_RANGE,
  ACTION_FIXME_SAVE_CUR_POS,
  ACTION_FIXME_RESTORE_CUR_POS,
  ACTION_SCROLL,
  ACTION_ERASE_CHAR,
  ACTION_BACK_TAB,
  ACTION_LINE_FEED_AND_CARRAGE_RETURN,
} from "./ansiDuplex";

export default function makeLegacyBufDuplex(duplex, { buf }) {
  const source = pipe(
    duplex.source,
    map(result => {
      result.forEach(({ type, data }) => {
        switch (type) {
          case ACTION_PUTS: {
            buf.puts(data);
            break;
          }
          case ACTION_ASSIGN_PARAMS_TO_ATTRS: {
            buf.assignParamsToAttrs(data);
            break;
          }
          case ACTION_INSERT: {
            buf.insert(data);
            break;
          }
          case ACTION_GOTO_POS: {
            buf.gotoPos(
              ("x" in data ? data.x : buf.cur_x) + (data.deltaX || 0),
              ("y" in data ? data.y : buf.cur_y) + (data.deltaY || 0)
            );
            break;
          }
          case ACTION_TAB: {
            buf.tab(data);
            break;
          }
          case ACTION_CLEAR: {
            buf.clear(data);
            break;
          }
          case ACTION_ERASE_LINE: {
            buf.eraseLine(data);
            break;
          }
          case ACTION_INSERT_LINE: {
            buf.insertLine(data);
            break;
          }
          case ACTION_DELETE_LINE: {
            buf.deleteLine(data);
            break;
          }
          case ACTION_DEL: {
            buf.del(data);
            break;
          }
          case ACTION_FIXME_SCROLL_RANGE: {
            const params = data;
            if (params.length < 2) {
              buf.scrollStart = 0;
              buf.scrollEnd = buf.rows - 1;
            } else {
              if (params[0] > 0) --params[0];
              if (params[1] > 0) --params[1];
              buf.scrollStart = params[0];
              buf.scrollEnd = params[1];
            }
            break;
          }
          case ACTION_FIXME_SAVE_CUR_POS: {
            buf.cur_x_sav = buf.cur_x;
            buf.cur_y_sav = buf.cur_y;
            break;
          }
          case ACTION_FIXME_RESTORE_CUR_POS: {
            if (!(buf.cur_x_sav < 0 || buf.cur_y_sav < 0)) {
              buf.cur_x = buf.cur_x_sav;
              buf.cur_y = buf.cur_y_sav;
            }
            break;
          }
          case ACTION_SCROLL: {
            buf.scroll(...data);
            break;
          }
          case ACTION_ERASE_CHAR: {
            buf.eraseChar(data);
            break;
          }
          case ACTION_BACK_TAB: {
            buf.backTab(data);
            break;
          }
          case ACTION_LINE_FEED_AND_CARRAGE_RETURN: {
            buf.lineFeed();
            buf.carriageReturn();
            break;
          }
        }
      });
    })
  );

  return {
    source,
    sink: duplex.sink,
  };
}
