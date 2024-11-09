import { Inflate } from "pako";
import DictionaryLoader from "./DictionaryLoader";

/**
 * Callback
 * @callback BrowserDictionaryLoader~onLoad
 * @param {Object} err Error object
 * @param {Uint8Array} buffer Loaded buffer
 */
export type BrowserDictionaryLoaderOnLoad = (
  err: string | ProgressEvent<EventTarget> | null,
  buffer: ArrayBufferLike | null
) => void;

class BrowserDictionaryLoader extends DictionaryLoader {
  /**
   * BrowserDictionaryLoader inherits DictionaryLoader, using jQuery XHR for download
   * @param {string} dic_path Dictionary path
   * @constructor
   */
  constructor(dic_path: string) {
    super(dic_path);
  }

  /**
   * Utility function to load gzipped dictionary
   * @param {string} url Dictionary URL
   * @param {BrowserDictionaryLoader~onLoad} callback Callback function
   */
  async loadArrayBuffer(url: string, callback: BrowserDictionaryLoaderOnLoad) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = function () {
        if (this.status > 0 && this.status !== 200) {
          callback(xhr.statusText, null);
          resolve();
          return;
        }
        const arraybuffer = new Uint8Array(this.response as ArrayBuffer);

        const inflate = new Inflate();
        inflate.push(arraybuffer, true);
        if (inflate.err) {
          reject(new Error(inflate.err.toString() + ": " + inflate.msg));
        }
        const decompressed = inflate.result;
        const typed_array =
          decompressed instanceof Uint8Array
            ? decompressed
            : new TextEncoder().encode(decompressed);
        callback(null, typed_array.buffer);
        resolve();
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
