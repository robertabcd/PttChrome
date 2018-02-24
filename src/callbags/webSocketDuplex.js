import { forEach } from "callbag-basics";

function noop() {}

const NullWS = {
  close: noop,
  send: noop,
};

export default function makeWebSocketDuplex({
  webSocketUrl,
  binaryType = "arraybuffer",
} = {}) {
  let ws = NullWS;
  return {
    source: (type, talkback) => {
      switch (type) {
        case 0: {
          ws = new WebSocket(webSocketUrl);
          ws.binaryType = binaryType;
          ws.addEventListener("open", () => {
            talkback(0, t => {
              if (t === 2) {
                ws = NullWS;
                ws.close();
              }
            });
          });
          ws.addEventListener("message", event => {
            talkback(1, event);
          });
          ws.addEventListener("error", error => {
            talkback(2, error);
          });
          ws.addEventListener("close", () => {
            ws = NullWS;
            talkback(2);
          });
          break;
        }
        default:
          break;
      }
    },
    forEachSink: forEach(data => ws.send(data)),
  };
}
