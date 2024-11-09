import fs from "node:fs";
import { Inflate } from "pako";
import DictionaryLoader from "./DictionaryLoader";

/**
 * @callback NodeDictionaryLoader~onLoad
 * @param {Object} err Error object
 * @param {Uint8Array} buffer Loaded buffer
 */
export type NodeDictionaryLoaderOnLoad = (
  err: Error | null,
  buffer?: ArrayBufferLike | null
) => void;

class NodeDictionaryLoader extends DictionaryLoader {
  /**
   * NodeDictionaryLoader inherits DictionaryLoader
   * @param {string} dic_path Dictionary path
   * @constructor
   */
  constructor(dic_path: string) {
    super(dic_path);
  }

  /**
   * Utility function
   * @param {string} file Dictionary file path
   * @param {NodeDictionaryLoader~onLoad} callback Callback function
   */
  async loadArrayBuffer(file: string, callback: NodeDictionaryLoaderOnLoad) {
    return new Promise<void>((resolve) => {
      // ここでfile（ファイルパス）からファイルを読み込んでいる
      fs.readFile(file, (err, buffer) => {
        if (err) {
          callback(err);
          resolve();
          return;
        }

        const inflate = new Inflate();
        inflate.push(Uint8Array.from(buffer), true);
        if (inflate.err) {
          callback(new Error(inflate.err.toString()));
          resolve();
          return;
        }
        const decompressed = inflate.result;
        const typed_array =
          decompressed instanceof Uint8Array
            ? decompressed
            : new TextEncoder().encode(decompressed);
        callback(null, typed_array.buffer);
        resolve();
      });
    });
  }
}

export default NodeDictionaryLoader;
