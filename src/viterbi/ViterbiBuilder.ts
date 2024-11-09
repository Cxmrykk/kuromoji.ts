import ViterbiNode from "./ViterbiNode";
import ViterbiLattice from "./ViterbiLattice";
import SurrogateAwareString from "../util/SurrogateAwareString";
import DynamicDictionaries from "../dict/DynamicDictionaries";
import DoubleArray from "../util/doublearray/doubleArrayClass";
import TokenInfoDictionary from "../dict/TokenInfoDictionary";
import UnknownDictionary from "../dict/UnknownDictionary";

class ViterbiBuilder {
  trie: DoubleArray;
  token_info_dictionary: TokenInfoDictionary;
  unknown_dictionary: UnknownDictionary;

  /**
   * ViterbiBuilder builds word lattice (ViterbiLattice)
   * @param {DynamicDictionaries} dic dictionary
   * @constructor
   */
  constructor(dic: DynamicDictionaries) {
    this.trie = dic.trie;
    this.token_info_dictionary = dic.token_info_dictionary;
    this.unknown_dictionary = dic.unknown_dictionary;
  }

  /**
   * Build word lattice
   * @param {string} sentence_str Input text
   * @returns {ViterbiLattice} Word lattice
   */
  build(sentence_str: string): ViterbiLattice {
    const lattice = new ViterbiLattice();
    const sentence = new SurrogateAwareString(sentence_str);

    let trie_id: number | undefined,
      left_id: number,
      right_id: number,
      word_cost: number;
    for (let pos = 0; pos < sentence.length; pos++) {
      const tail = sentence.slice(pos);
      const vocabulary = this.trie.commonPrefixSearch(tail);
      for (let n = 0; n < vocabulary.length; n++) {
        // Words in dictionary do not have surrogate pair (only UCS2 set)
        trie_id = vocabulary[n].v;
        let key = vocabulary[n].k;
        if (key === null || key === undefined) continue;

        if (trie_id == null) continue;

        const token_info_ids = this.token_info_dictionary.target_map[trie_id];
        for (let i = 0; i < token_info_ids.length; i++) {
          // FIXME parseInt要らない説
          const token_info_id = parseInt(token_info_ids[i].toString());

          left_id =
            this.token_info_dictionary.dictionary.getShort(token_info_id);
          right_id = this.token_info_dictionary.dictionary.getShort(
            token_info_id + 2
          );
          word_cost = this.token_info_dictionary.dictionary.getShort(
            token_info_id + 4
          );

          // node_name, cost, start_index, length, type, left_id, right_id, surface_form
          lattice.append(
            new ViterbiNode(
              token_info_id,
              word_cost,
              pos + 1,
              key.length,
              "KNOWN",
              left_id,
              right_id,
              key
            )
          );
        }
      }

      // Unknown word processing
      const surrogate_aware_tail = new SurrogateAwareString(tail);
      const head_char = new SurrogateAwareString(
        surrogate_aware_tail.charAt(0)
      );
      const head_char_class = this.unknown_dictionary.lookup(
        head_char.toString()
      );
      if (head_char_class === undefined) continue;
      if (
        vocabulary == null ||
        vocabulary.length === 0 ||
        head_char_class.is_always_invoke === 1
      ) {
        // Process unknown word
        let key: SurrogateAwareString | string = head_char;
        if (
          head_char_class.is_grouping === 1 &&
          1 < surrogate_aware_tail.length
        ) {
          for (var k = 1; k < surrogate_aware_tail.length; k++) {
            const next_char = surrogate_aware_tail.charAt(k);
            const next_char_class = this.unknown_dictionary.lookup(next_char);
            if (head_char_class.class_name !== next_char_class?.class_name) {
              break;
            }
            key = key.toString() + next_char;
          }
        }

        const unk_ids =
          this.unknown_dictionary.target_map[head_char_class.class_id];
        for (let j = 0; j < unk_ids.length; j++) {
          // FIXME parseInt要らない説
          const unk_id = parseInt(unk_ids[j].toString());

          left_id = this.unknown_dictionary.dictionary.getShort(unk_id);
          right_id = this.unknown_dictionary.dictionary.getShort(unk_id + 2);
          word_cost = this.unknown_dictionary.dictionary.getShort(unk_id + 4);

          // node_name, cost, start_index, length, type, left_id, right_id, surface_form
          lattice.append(
            new ViterbiNode(
              unk_id,
              word_cost,
              pos + 1,
              key.length,
              "UNKNOWN",
              left_id,
              right_id,
              key.toString()
            )
          );
        }
      }
    }
    lattice.appendEos();

    return lattice;
  }
}

export default ViterbiBuilder;
