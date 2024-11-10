import DynamicDictionaries from "../dict/DynamicDictionaries";

export type DictionaryLoaderOnLoad = (
  err: Error | null, // Corrected type
  dic: DynamicDictionaries
) => void;


class DictionaryLoader {
  dic: DynamicDictionaries;

  constructor() {
    this.dic = new DynamicDictionaries();
  }

  load(json: any) {
    try {
    return this.dic.load(json);
    } catch (error) {
      throw new Error("Failed to load dictionary: " + error);
    }
  }
}

export default DictionaryLoader;