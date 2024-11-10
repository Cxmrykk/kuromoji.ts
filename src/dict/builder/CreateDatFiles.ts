import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import IPADic from "@cxmrykk/mecab-ipadic-seed.ts";
import kuromoji from "../../..";
import DictionaryBuilder from "./DictionaryBuilder";
import { pathJoin } from "../../util/PathJoin";
import * as pako from "pako";

const outDir = "dict-output/";

const createDatFiles = async () => {
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

  await buildBinaryDictionaries(
    [tokenInfo(), matrixDef(), unkDef(), charDef()],
    builder
  );
};


const buildBinaryDictionaries = async (
  promises: Promise<void>[],
  builder: DictionaryBuilder
) => {
  await Promise.all(promises);
  console.log("Finished to read all seed dictionary files");
  console.log("Building binary dictionary ...");
  const dic = builder.build();

  // Compress buffers using pako.deflate
  const base_buffer = pako.deflate(new Uint8Array(dic.trie.bc.getBaseBuffer()));
  const check_buffer = pako.deflate(new Uint8Array(dic.trie.bc.getCheckBuffer()));
  const token_info_buffer = pako.deflate(dic.token_info_dictionary.dictionary.buffer);
  const tid_pos_buffer = pako.deflate(dic.token_info_dictionary.pos_buffer.buffer);
  const tid_map_buffer = pako.deflate(dic.token_info_dictionary.targetMapToBuffer());
  const connection_costs_buffer = pako.deflate(new Uint8Array(dic.connection_costs.buffer));
  const unk_buffer = pako.deflate(dic.unknown_dictionary.dictionary.buffer);
  const unk_pos_buffer = pako.deflate(dic.unknown_dictionary.pos_buffer.buffer);
  const unk_map_buffer = pako.deflate(dic.unknown_dictionary.targetMapToBuffer());
  const char_map_buffer = dic.unknown_dictionary.character_definition?.character_category_map ? pako.deflate(dic.unknown_dictionary.character_definition.character_category_map) : new Uint8Array(0);
  const char_compat_map_buffer = dic.unknown_dictionary.character_definition?.compatible_category_map ? pako.deflate(new Uint8Array(dic.unknown_dictionary.character_definition.compatible_category_map.buffer)) : new Uint8Array(0);
  const invoke_definition_map_buffer = dic.unknown_dictionary.character_definition?.invoke_definition_map?.toBuffer() ? pako.deflate(dic.unknown_dictionary.character_definition.invoke_definition_map.toBuffer()) : new Uint8Array(0);

  writeFileSync(pathJoin([outDir, "base.dat"]), base_buffer);
  writeFileSync(pathJoin([outDir, "check.dat"]), check_buffer);
  writeFileSync(pathJoin([outDir, "tid.dat"]), token_info_buffer);
  writeFileSync(pathJoin([outDir, "tid_pos.dat"]), tid_pos_buffer);
  writeFileSync(pathJoin([outDir, "tid_map.dat"]), tid_map_buffer);
  writeFileSync(pathJoin([outDir, "cc.dat"]), connection_costs_buffer);
  writeFileSync(pathJoin([outDir, "unk.dat"]), unk_buffer);
  writeFileSync(pathJoin([outDir, "unk_pos.dat"]), unk_pos_buffer);
  writeFileSync(pathJoin([outDir, "unk_map.dat"]), unk_map_buffer);
  writeFileSync(pathJoin([outDir, "unk_char.dat"]), char_map_buffer);
  writeFileSync(pathJoin([outDir, "unk_compat.dat"]), char_compat_map_buffer);
  writeFileSync(pathJoin([outDir, "unk_invoke.dat"]), invoke_definition_map_buffer);
};

await createDatFiles();