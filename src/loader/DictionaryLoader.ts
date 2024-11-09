import DynamicDictionaries from "../dict/DynamicDictionaries";
import kuromojiJson from "../../dict/kuromoji.json";

export type DictionaryLoaderOnLoad = (
  err: Error | null, // Corrected type
  dic: DynamicDictionaries
) => void;


class DictionaryLoader {
  dic: DynamicDictionaries;

  constructor() {
    this.dic = new DynamicDictionaries();
  }

  async load(load_callback: DictionaryLoaderOnLoad) {
    try {
      this.dic.load(kuromojiJson);
      load_callback(null, this.dic);
    } catch (err: unknown) { // Type guard
      load_callback(err instanceof Error ? err : new Error("Failed to load dictionary"), this.dic);
    }
  }
}

export default DictionaryLoader;