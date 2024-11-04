import zlib from 'zlib';
import DictionaryLoader from "./DictionaryLoader";

export type BrowserDictionaryLoaderOnLoad = (
  err: string | ProgressEvent<EventTarget> | Error | null,
  buffer: ArrayBufferLike | null
) => void;

class BrowserDictionaryLoader extends DictionaryLoader {
  constructor(dic_path: string) {
    super(dic_path);
  }

  async loadArrayBuffer(url: string, callback: BrowserDictionaryLoaderOnLoad) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer"; // Important: keep this as arraybuffer
      xhr.onload = function () {
        if (this.status > 0 && this.status !== 200) {
          callback(xhr.statusText, null);
          resolve();
          return;
        }

        const arraybuffer = new Uint8Array(this.response as ArrayBuffer);

        zlib.gunzip(arraybuffer, (err, decompressed) => {
          if (err) {
            callback(err, null);
            reject(err);
            return;
          }

          // CRITICAL FIX: Create a new ArrayBuffer from the Uint8Array
          const buffer = decompressed.buffer.slice(0); // This creates a copy to own the buffer

          callback(null, buffer); // Pass the ArrayBuffer
          resolve();
        });
      };
      xhr.onerror = function (err) {
        callback(err, null);
        resolve();
      };
      xhr.send();
    });
  }
}

export default BrowserDictionaryLoader;