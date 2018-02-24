import { pipe, map, fromIter, flatten } from "callbag-basics";
import makeSubject from "callbag-subject";

const CHUNK = 1000;

export const mapSource = map(event =>
  String.fromCharCode(...new Uint8Array(event.data))
);

export const mapSink = source =>
  pipe(
    source,
    map(str => {
      const result = [];
      // because ptt seems to reponse back slowly after large
      // chunk of text is pasted, so better to split it up.
      for (let i = 0; i < str.length; i += CHUNK) {
        const chunkStr = str.substring(i, i + CHUNK);
        const byteArray = new Uint8Array(
          chunkStr.split("").map(it => it.charCodeAt(0))
        );
        result.push(byteArray.buffer);
      }
      return fromIter(result);
    }),
    flatten
  );
