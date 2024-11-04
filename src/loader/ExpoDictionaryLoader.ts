import zlib from 'zlib';
import DictionaryLoader from "./DictionaryLoader";
import * as FileSystem from 'expo-file-system';

export type ExpoDictionaryLoaderOnLoad = (
  err: string | ProgressEvent<EventTarget> | Error | null,
  buffer: ArrayBufferLike | null
) => void;

class ExpoDictionaryLoader extends DictionaryLoader {
  constructor(dic_path: string) {
    super(dic_path);
  }

  async loadArrayBuffer(file: string, callback: ExpoDictionaryLoaderOnLoad) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const info = await FileSystem.getInfoAsync(file);

        if (!info.exists) {
          callback(new Error(`File not found: ${file}`), null);
          resolve();
          return;
        }

        const base64 = await FileSystem.readAsStringAsync(file, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const arraybuffer = Uint8Array.from(atob(base64), (c) =>
          c.charCodeAt(0)
        );

        zlib.gunzip(arraybuffer, (err, decompressed) => {
          if (err) {
            callback(err, null);
            reject(err);
            return;
          }

          const buffer = decompressed.buffer.slice(0);

          callback(null, buffer);
          resolve();
        });
      } catch (err) {
        callback(err as Error, null);
        resolve();
      }
    });
  }
}

export default ExpoDictionaryLoader;