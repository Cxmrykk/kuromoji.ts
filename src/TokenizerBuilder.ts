import Tokenizer from "./Tokenizer";
import NodeDictionaryLoader from "./loader/DictionaryLoader"; // Updated import

export interface TokenizerBuilderOption {
  dicPath?: string;
}

export type TokenizerBuilderOnLoad = (
  err: (Error | null)[],
  tokenizer?: Tokenizer
) => void;

class TokenizerBuilder {
  dic_path: string;

  constructor(option: TokenizerBuilderOption = {}) {
    if (option.dicPath == null) {
      this.dic_path = "dict/"; // This is now unused
    } else {
      this.dic_path = option.dicPath; // This is now unused
    }
  }

  async build(callback: TokenizerBuilderOnLoad) {
    const loader = new NodeDictionaryLoader(); // dic_path is unused
    await loader.load((err, dic) => {
      callback([err], new Tokenizer(dic));
    });
  }
}

export default TokenizerBuilder;