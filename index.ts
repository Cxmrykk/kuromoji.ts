import type { TokenizerBuilderOption } from "./src/TokenizerBuilder";

import TokenizerBuilder from "./src/TokenizerBuilder";
import DictionaryBuilder from "./src/dict/builder/DictionaryBuilder";

// Public methods
const kuromoji = {
  builder: (option: TokenizerBuilderOption = {}) => {
    return new TokenizerBuilder(option);
  },
  dictionaryBuilder: () => {
    return new DictionaryBuilder();
  },
};

export default kuromoji;
