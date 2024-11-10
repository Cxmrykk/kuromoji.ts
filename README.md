<div align="center">
  <h1>Cxmrykk/kuromoji.ts</h1>
  <p>Optimised fork of MijinkoSD/kuromoji.ts</p>
</div>

### About
- Used for my app, feel free to use in your project too. Credit to MijinkoSD for the original code

### Install
```sh
# Using bun
bun add @cxmrykk/kuromoji

# Using NPM (untested)
npm install @cxmrykk/kuromoji
```

### Example
```ts
import TokenizerBuilder from "./src/TokenizerBuilder";
import { isNotContainUndefined } from "./src/util/TypeGuard";

const test = async () => {
  const builder = new TokenizerBuilder();
  builder.build(async (err, tokenizer) => {
    if (isNotContainUndefined(err) && err[0] !== null) {
      console.error("Error building tokenizer:", err[0]);
      return;
    }
    if (tokenizer === undefined) {
      console.error("Tokenizer is undefined");
      return;
    }

    const tokens = tokenizer.tokenize("すもももももももものうち");
    console.log(tokens);

    const tokens2 = tokenizer.tokenize("今日はいい天気です。");
    console.log(tokens2);

    const tokens3 = tokenizer.tokenize("寿司が食べたい。");
    console.log(tokens3);

    const tokens4 = tokenizer.tokenize("私はプログラマーです。");
    console.log(tokens4);

    const tokens5 = tokenizer.tokenize("これはテストです。");
    console.log(tokens5);
  });
};

test();
```

### More Documentation
- See [MijinkoSD/kuromoji.ts](https://github.com/MijinkoSD/kuromoji.ts) for further information
