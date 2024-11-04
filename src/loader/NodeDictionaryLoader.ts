import zlib from 'zlib';
import fs from 'fs';
import DictionaryLoader from "./DictionaryLoader";

export type NodeDictionaryLoaderOnLoad = (
  err: Error | null,
  buffer?: ArrayBufferLike | null
) => void;

class NodeDictionaryLoader extends DictionaryLoader {
  constructor(dic_path: string) {
    super(dic_path);
  }

  async loadArrayBuffer(file: string, callback: NodeDictionaryLoaderOnLoad) {
    return new Promise<void>((resolve) => {
      fs.readFile(file, (err, buffer) => {
        if (err) {
          callback(err, null);
          resolve();
          return;
        }

        // Cast buffer to Uint8Array:
        zlib.gunzip(Uint8Array.from(buffer), (err, decompressed) => {
          if (err) {
            callback(err, null);
            resolve();
            return;
          }

          const typed_array = decompressed instanceof Uint8Array ? decompressed : new Uint8Array(decompressed);
          callback(null, typed_array.buffer);
          resolve();
        });
      });
    });
  }
}

export default NodeDictionaryLoader;