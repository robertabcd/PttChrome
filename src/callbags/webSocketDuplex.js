import { pipe, fromEvent, forEach } from "callbag-basics";
import makeSubject from "callbag-subject";

const CHUNK = 1000;

export default function makeWebSocketDuplex(url) {
  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";

  const source = makeSubject();
  pipe(fromEvent(ws, "open"), forEach(() => {}));
  pipe(
    fromEvent(ws, "message"),
    forEach(event => {
      source(1, String.fromCharCode(...new Uint8Array(event.data)));
    })
  );
  pipe(
    fromEvent(ws, "error"),
    forEach(error => {
      source(2, error);
    })
  );
  pipe(
    fromEvent(ws, "close"),
    forEach(() => {
      source(2);
    })
  );
  // source(0, (t, data) => {
  // console.log('---')
  // console.log(t, data)
  // console.log('---')
  // });

  const sink = makeSubject();
  sink(0, (t, str) => {
    switch (t) {
      case 0:
        break;
      case 1: {
        // because ptt seems to reponse back slowly after large
        // chunk of text is pasted, so better to split it up.
        for (let i = 0; i < str.length; i += CHUNK) {
          const chunkStr = str.substring(i, i + CHUNK);
          const byteArray = new Uint8Array(
            chunkStr.split("").map(it => it.charCodeAt(0))
          );
          ws.send(byteArray.buffer);
        }
        break;
      }
      case 2: {
        ws.close();
        break;
      }
    }
  });
  return {
    source,
    sink,
  };
}
