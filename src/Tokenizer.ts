
import ViterbiBuilder from "./viterbi/ViterbiBuilder";
import ViterbiSearcher from "./viterbi/ViterbiSearcher";
import IpadicFormatter from "./util/IpadicFormatter";
import type { IpadicFormatterToken } from "./util/IpadicFormatter";
import DynamicDictionaries from "./dict/DynamicDictionaries";
import ViterbiLattice from "./viterbi/ViterbiLattice";

/**
 * 読点と句読点。
 */
const PUNCTUATION = /、|。/;

class Tokenizer {
  token_info_dictionary;
  unknown_dictionary;
  viterbi_builder;
  viterbi_searcher;
  formatter;

  /**
   * Tokenizer
   * @param {DynamicDictionaries} dic Dictionaries used by this tokenizer
   * @constructor
   */
  constructor(dic: DynamicDictionaries) {
    this.token_info_dictionary = dic.token_info_dictionary;
    this.unknown_dictionary = dic.unknown_dictionary;
    this.viterbi_builder = new ViterbiBuilder(dic);
    this.viterbi_searcher = new ViterbiSearcher(dic.connection_costs);
    this.formatter = new IpadicFormatter(); // TODO Other dictionaries
  }

  /**
   * Split into sentence by punctuation
   * @param {string} input Input text
   * @returns {Array.<string>} Sentences end with punctuation
   */
  static splitByPunctuation(input: string): string[] {
    const sentences = [];
    let tail = input;
    while (true) {
      if (tail === "") {
        break;
      }
      const index = tail.search(PUNCTUATION);
      if (index < 0) {
        sentences.push(tail);
        break;
      }
      sentences.push(tail.substring(0, index + 1));
      tail = tail.substring(index + 1);
    }
    return sentences;
  }

  /**
   * Tokenize text
   * @param {string} text Input text to analyze
   * @returns {Array} Tokens
   */
  tokenize(text: string) {
    const sentences = Tokenizer.splitByPunctuation(text);
    const tokens: IpadicFormatterToken[] = [];
    for (const sentence of sentences) {
      tokens.push(...this.tokenizeForSentence(sentence, tokens));
    }
    return tokens;
  }

  tokenizeForSentence(
    sentence: string,
    tokens?: IpadicFormatterToken[]
  ): IpadicFormatterToken[] {
    if (tokens === undefined) {
      tokens = [];
    }
    const lattice = this.getLattice(sentence);
    const best_path = this.viterbi_searcher.search(lattice);
    let last_pos = 0;
    if (tokens.length > 0) {
      last_pos = tokens[tokens.length - 1].word_position;
    }

    const result: IpadicFormatterToken[] = [];

    for (const node of best_path) {
      let token: IpadicFormatterToken,
        features: string[],
        features_line: string;
      if (node.type === "KNOWN") {
        features_line = this.token_info_dictionary.getFeatures(
          node.name.toString()
        );
        if (features_line == null) {
          features = [];
        } else {
          features = features_line.split(",");
        }
        token = this.formatter.formatEntry(
          node.name,
          last_pos + node.start_pos,
          node.type,
          features
        );
      } else if (node.type === "UNKNOWN") {
        // Unknown word
        features_line = this.unknown_dictionary.getFeatures(
          node.name.toString()
        );
        if (features_line == null) {
          features = [];
        } else {
          features = features_line.split(",");
        }
        token = this.formatter.formatUnknownEntry(
          node.name,
          last_pos + node.start_pos,
          node.type,
          features,
          node.surface_form
        );
      } else {
        // TODO User dictionary
        token = this.formatter.formatEntry(
          node.name,
          last_pos + node.start_pos,
          node.type,
          []
        );
      }

      result.push(token);
    }

    return result;
  }

  /**
   * Build word lattice
   * @param {string} text Input text to analyze
   * @returns {ViterbiLattice} Word lattice
   */
  getLattice(text: string): ViterbiLattice {
    return this.viterbi_builder.build(text);
  }
}

export default Tokenizer;
