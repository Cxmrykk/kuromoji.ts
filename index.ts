import Tokenizer from "./src/Tokenizer";
import DynamicDictionaries from "./src/dict/DynamicDictionaries";
import DictionaryBuilder from "./src/dict/builder/DictionaryBuilder";

// Public methods
const kuromoji = {
  tokenizer: (json: any) => {
    // Load the dictionary contents from JSON file
    const dic = new DynamicDictionaries();

    // Return the tokenizer instance
    return new Tokenizer(dic.load(json));
  },
  dictionaryBuilder: () => {
    return new DictionaryBuilder();
  },
};

export default kuromoji;
