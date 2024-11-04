import doublearray from "doublearray.ts";
import DynamicDictionaries from "../DynamicDictionaries";
import TokenInfoDictionary from "../TokenInfoDictionary";
import ConnectionCostsBuilder from "./ConnectionCostsBuilder";
import CharacterDefinitionBuilder from "./CharacterDefinitionBuilder";
import UnknownDictionary from "../UnknownDictionary";
import type { Key } from "doublearray.ts/dist/types";

class DictionaryBuilder {
  tid_entries: string[][];
  unk_entries: string[][];
  cc_builder: ConnectionCostsBuilder;
  cd_builder: CharacterDefinitionBuilder;

  /**
   * Build dictionaries (token info, connection costs)
   *
   * Generates from matrix.def
   * cc.dat: Connection costs
   *
   * Generates from *.csv
   * dat.dat: Double array
   * tid.dat: Token info dictionary
   * tid_map.dat: targetMap
   * tid_pos.dat: posList (part of speech)
   */
  constructor() {
    // Array of entries, each entry in Mecab form
    // (0: surface form, 1: left id, 2: right id, 3: word cost, 4: part of speech id, 5-: other features)
    this.tid_entries = [];
    this.unk_entries = [];
    this.cc_builder = new ConnectionCostsBuilder();
    this.cd_builder = new CharacterDefinitionBuilder();
  }

  addTokenInfoDictionary(line: string) {
    var new_entry = line.split(",");
    this.tid_entries.push(new_entry);
    return this;
  }

  /**
   * Put one line of "matrix.def" file for building ConnectionCosts object
   * @param {string} line is a line of "matrix.def"
   */
  putCostMatrixLine(line: string) {
    this.cc_builder.putLine(line);
    return this;
  }

  putCharDefLine(line: string) {
    this.cd_builder.putLine(line);
    return this;
  }

  /**
   * Put one line of "unk.def" file for building UnknownDictionary object
   * @param {string} line is a line of "unk.def"
   */
  putUnkDefLine(line: string) {
    this.unk_entries.push(line.split(","));
    return this;
  }

  build() {
    var dictionaries = this.buildTokenInfoDictionary();
    var unknown_dictionary = this.buildUnknownDictionary();

    return new DynamicDictionaries(
      dictionaries.trie,
      dictionaries.token_info_dictionary,
      this.cc_builder.build(),
      unknown_dictionary
    );
  }

  /**
   * Build TokenInfoDictionary
   *
   * @returns {{trie: *, token_info_dictionary: *}}
   */
  buildTokenInfoDictionary() {
    var token_info_dictionary = new TokenInfoDictionary();

    // using as hashmap, string -> string (word_id -> surface_form) to build dictionary
    var dictionary_entries = token_info_dictionary.buildDictionary(
      this.tid_entries
    );

    var trie = this.buildDoubleArray();

    for (let entry in dictionary_entries) {
      let token_info_id = parseInt(entry);
      var surface_form = dictionary_entries[token_info_id];
      var trie_id = trie.lookup(surface_form.toString());

      // Assertion
      // if (trie_id < 0) {
      //     console.log("Not Found:" + surface_form);
      // }

      token_info_dictionary.addMapping(trie_id, token_info_id);
    }

    return {
      trie: trie,
      token_info_dictionary: token_info_dictionary,
    };
  }

  buildUnknownDictionary() {
    var unk_dictionary = new UnknownDictionary();

    // using as hashmap, string -> string (word_id -> surface_form) to build dictionary
    var dictionary_entries = unk_dictionary.buildDictionary(this.unk_entries);

    var char_def = this.cd_builder.build(); // Create CharacterDefinition

    unk_dictionary.characterDefinition(char_def);

    for (let entry in dictionary_entries) {
      const token_info_id = Number(entry);
      var class_name = dictionary_entries[token_info_id];
      var class_id = char_def.invoke_definition_map?.lookup(class_name);

      // Assertion
      // if (trie_id < 0) {
      //     console.log("Not Found:" + surface_form);
      // }

      if (class_id == null) continue;
      unk_dictionary.addMapping(class_id, token_info_id);
    }

    return unk_dictionary;
  }

  /**
   * Build double array trie
   *
   * @returns {DoubleArray} Double-Array trie
   */
  buildDoubleArray() {
    var trie_id = 0;
    var words: Key[] = this.tid_entries.map((entry) => {
      var surface_form = entry[0];
      return { k: surface_form.toString(), v: trie_id++ };
    });

    var builder = doublearray.builder(1024 * 1024);
    return builder.build(words);
  }
}

export default DictionaryBuilder;
