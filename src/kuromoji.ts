import type { TokenizerBuilderOption } from "./TokenizerBuilder";

import TokenizerBuilder from "./TokenizerBuilder";
import DictionaryBuilder from "./dict/builder/DictionaryBuilder";

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
