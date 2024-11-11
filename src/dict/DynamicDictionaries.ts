import TokenInfoDictionary from "./TokenInfoDictionary";
import ConnectionCosts from "./ConnectionCosts";
import UnknownDictionary from "./UnknownDictionary";
import doublearray from "../util/doublearray";
import type DoubleArray from "../util/doublearray/doubleArrayClass";
import InvokeDefinitionMap from "./InvokeDefinitionMap";
import pako from "pako";

class DynamicDictionaries {
  trie: DoubleArray;
  token_info_dictionary: TokenInfoDictionary;
  connection_costs: ConnectionCosts;
  unknown_dictionary: UnknownDictionary;

  /**
   * Dictionaries container for Tokenizer
   * @param {DoubleArray} trie
   * @param {TokenInfoDictionary} token_info_dictionary
   * @param {ConnectionCosts} connection_costs
   * @param {UnknownDictionary} unknown_dictionary
   * @constructor
   */
  constructor(
    trie?: DoubleArray | null,
    token_info_dictionary?: TokenInfoDictionary | null,
    connection_costs?: ConnectionCosts | null,
    unknown_dictionary?: UnknownDictionary | null
  ) {
    if (trie != null) {
      this.trie = trie;
    } else {
      this.trie = doublearray.builder(0).build([{ k: "", v: 1 }]);
    }
    if (token_info_dictionary != null) {
      this.token_info_dictionary = token_info_dictionary;
    } else {
      this.token_info_dictionary = new TokenInfoDictionary();
    }
    if (connection_costs != null) {
      this.connection_costs = connection_costs;
    } else {
      // backward_size * backward_size
      this.connection_costs = new ConnectionCosts(0, 0);
    }
    if (unknown_dictionary != null) {
      this.unknown_dictionary = unknown_dictionary;
    } else {
      this.unknown_dictionary = new UnknownDictionary();
    }
  }

  // from base.dat & check.dat
  loadTrie(base_buffer: Int32Array, check_buffer: Int32Array) {
    this.trie = doublearray.load(base_buffer, check_buffer);
    return this;
  }

  loadTokenInfoDictionaries(
    token_info_buffer: ArrayBufferLike,
    pos_buffer: ArrayBufferLike,
    target_map_buffer: ArrayBufferLike
  ) {
    this.token_info_dictionary.loadDictionary(new Uint8Array(token_info_buffer));
    this.token_info_dictionary.loadPosVector(new Uint8Array(pos_buffer));
    this.token_info_dictionary.loadTargetMap(new Uint8Array(target_map_buffer));
    return this;
  }

  loadConnectionCosts(cc_buffer: Int16Array) {
    this.connection_costs.loadConnectionCosts(cc_buffer);
    return this;
  }

  loadUnknownDictionaries(
    unk_buffer: Uint8Array,
    unk_pos_buffer: Uint8Array,
    unk_map_buffer: Uint8Array,
    cat_map_buffer: Uint8Array,
    compat_cat_map_buffer: Uint32Array,
    invoke_def_buffer: Uint8Array
  ) {
    this.unknown_dictionary.loadUnknownDictionaries(
      unk_buffer,
      unk_pos_buffer,
      unk_map_buffer,
      cat_map_buffer,
      compat_cat_map_buffer,
      invoke_def_buffer
    );
    return this;
  }

  load(jsonData: any) {
    this.trie = doublearray.load(
      pako.inflate(jsonData.base),
      pako.inflate(jsonData.check)
    );

    this.token_info_dictionary.loadDictionary(pako.inflate(jsonData.tid));
    this.token_info_dictionary.loadPosVector(pako.inflate(jsonData.tid_pos));
    this.token_info_dictionary.loadTargetMap(pako.inflate(jsonData.tid_map));
    this.connection_costs.loadConnectionCosts(new Int16Array(pako.inflate(jsonData.cc)));
    this.unknown_dictionary.loadDictionary(pako.inflate(jsonData.unk));
    this.unknown_dictionary.loadPosVector(pako.inflate(jsonData.unk_pos));
    this.unknown_dictionary.loadTargetMap(pako.inflate(jsonData.unk_map));

    const char_def = this.unknown_dictionary.character_definition;
    if (char_def) {
      char_def.character_category_map = pako.inflate(jsonData.unk_char);
      char_def.compatible_category_map = new Uint32Array(pako.inflate(jsonData.unk_compat));
      char_def.invoke_definition_map = InvokeDefinitionMap.load(pako.inflate(jsonData.unk_invoke));
    }

    return this;
  }
}

export default DynamicDictionaries;
