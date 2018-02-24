import { forEach } from "callbag-basics";

export default function makeWebSocketDuplex({
  url,
  binaryType = "arraybuffer",
} = {}) {
  let ws;
  return {
    source: (type, talkback) => {
      switch (type) {
        case 0: {
          ws = new WebSocket(url);
          ws.binaryType = binaryType;
          ws.addEventListener("open", () => {
            talkback(0);
          });
          ws.addEventListener("message", event => {
            talkback(1, event);
          });
          ws.addEventListener("error", error => {
            talkback(2, error);
          });
          ws.addEventListener("close", () => {
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
