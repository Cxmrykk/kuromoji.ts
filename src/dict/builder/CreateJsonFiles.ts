import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import IPADic from "@cxmrykk/mecab-ipadic-seed.ts";
import kuromoji from "../../../index.ts";
import DictionaryBuilder from "./DictionaryBuilder";
import { pathJoin } from "../../util/PathJoin";
import * as pako from "pako";

const outDir = "dict-json/";

const createJsonFiles = async () => {
  if (!existsSync(outDir)) {
    mkdirSync(outDir);
  }

  const dic = new IPADic();
  const builder = kuromoji.dictionaryBuilder();

  // Build token info dictionary
  const tokenInfo = async () => {
    await dic.readTokenInfo((line) => {
      builder.addTokenInfoDictionary(line);
    });
    console.log("Finished to read token info dics");
  };

  // Build connection costs matrix
  const matrixDef = async () => {
    await dic.readMatrixDef((line) => {
      builder.putCostMatrixLine(line);
    });
    console.log("Finished to read matrix.def");
  };

  // Build unknown dictionary
  const unkDef = async () => {
    await dic.readUnkDef((line) => {
      builder.putUnkDefLine(line);
    });
    console.log("Finished to read unk.def");
  };

  // Build character definition dictionary
  const charDef = async () => {
    await dic.readCharDef((line) => {
      builder.putCharDefLine(line);
    });
    console.log("Finished to read char.def");
  };

  await buildJsonDictionaries(
    [tokenInfo(), matrixDef(), unkDef(), charDef()],
    builder
  );
};


const buildJsonDictionaries = async (
  promises: Promise<void>[],
  builder: DictionaryBuilder
) => {
  await Promise.all(promises);
  console.log("Finished to read all seed dictionary files");
  console.log("Building JSON dictionary ...");
  const dic = builder.build();

  const jsonObject = {
    base: Array.from(pako.deflate(new Uint8Array(dic.trie.bc.getBaseBuffer().buffer))), // Convert to Uint8Array before deflating
    check: Array.from(pako.deflate(new Uint8Array(dic.trie.bc.getCheckBuffer().buffer))), // Convert to Uint8Array before deflating
    tid: Array.from(pako.deflate(dic.token_info_dictionary.dictionary.buffer)),
    tid_pos: Array.from(pako.deflate(dic.token_info_dictionary.pos_buffer.buffer)),
    tid_map: Array.from(pako.deflate(dic.token_info_dictionary.targetMapToBuffer())),
    cc: Array.from(pako.deflate(new Uint8Array(dic.connection_costs.buffer.buffer))),
    unk: Array.from(pako.deflate(dic.unknown_dictionary.dictionary.buffer)),
    unk_pos: Array.from(pako.deflate(dic.unknown_dictionary.pos_buffer.buffer)),
    unk_map: Array.from(pako.deflate(dic.unknown_dictionary.targetMapToBuffer())),
    unk_char: Array.from(pako.deflate(dic.unknown_dictionary.character_definition?.character_category_map || new Uint8Array(0))),
    unk_compat: Array.from(pako.deflate(new Uint8Array(dic.unknown_dictionary.character_definition?.compatible_category_map?.buffer || new ArrayBuffer(0)))), // Convert to Uint8Array before deflating
    unk_invoke: Array.from(pako.deflate(dic.unknown_dictionary.character_definition?.invoke_definition_map?.toBuffer() || new Uint8Array(0))),
  };


  writeFileSync(
    pathJoin([outDir, "kuromoji.json"]),
    JSON.stringify(jsonObject)
  );
  console.log("Finished to create kuromoji.json");
};
export { createJsonFiles };

await createJsonFiles();