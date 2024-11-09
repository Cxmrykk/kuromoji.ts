import Tokenizer from "./Tokenizer";
import BrowserDictionaryLoader from "./loader/BrowserDictionaryLoader";
import NodeDictionaryLoader from "./loader/NodeDictionaryLoader";

export interface TokenizerBuilderOption {
  dicPath?: string;
}

/**
 * Callback used by build
 * @callback TokenizerBuilder~onLoad
 * @param {Object} err Error object
 * @param {Tokenizer} tokenizer Prepared Tokenizer
 */
export type TokenizerBuilderOnLoad = (
  err: (Error | null)[],
  tokenizer?: Tokenizer
) => void;

class TokenizerBuilder {
  dic_path: string;

  /**
   * TokenizerBuilder create Tokenizer instance.
   * @param {Object} option JSON object which have key-value pairs settings
   * @param {string} option.dicPath Dictionary directory path (or URL using in browser)
   * @constructor
   */
  constructor(option: TokenizerBuilderOption = {}) {
    if (option.dicPath == null) {
      this.dic_path = "dict/";
    } else {
      this.dic_path = option.dicPath;
    }
  }

  /**
   * Build Tokenizer instance by asynchronous manner
   * @param {TokenizerBuilder~onLoad} callback Callback function
   */
  async build(callback: TokenizerBuilderOnLoad) {
    const loader = new NodeDictionaryLoader(this.dic_path);
    await loader.load((err, dic) => {
      callback(toErrorArray(err), new Tokenizer(dic));
    });
  }

  async buildBrowser(callback: TokenizerBuilderOnLoad) {
    const loader = new BrowserDictionaryLoader(this.dic_path);
    await loader.load((err, dic) => {
      callback(toErrorArray(err), new Tokenizer(dic));
    });
  }
}

/**
 * To convert an object to an array of error objects.
 * オブジェクトをエラーオブジェクト配列に変換します。
 *
 * I said "To convert", but it works well only from error object or string type.
 * 変換するとは言ってもエラーオブジェクトか文字列しかうまく変換できないけれど。
 *
 * @param obj オブジェクト
 * @returns
 */
const toErrorArray = (obj: Object | null): (Error | null)[] => {
  let _obj: (Object | null)[];
  if (Array.isArray(obj)) {
    _obj = obj;
  } else {
    _obj = [obj];
  }
  const result: (Error | null)[] = [];
  for (const o of _obj) {
    if (o instanceof Error || o === null) {
      result.push(o);
    } else if (typeof o === "string") {
      result.push(new Error(o));
    } else {
      result.push(new Error("unknown error object recieved."));
    }
  }
  return result;
};

export default TokenizerBuilder;
