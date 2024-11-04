import type { ViterbiNodeType } from "../viterbi/ViterbiNode";

export interface IpadicFormatterToken {
  /** 辞書内での単語ID */
  word_id: number;
  /** 単語タイプ(辞書に登録されている単語ならKNOWN, 未知語ならUNKNOWN) */
  word_type: ViterbiNodeType;
  /** 単語の開始位置 */
  word_position: number;
  /** 表層形 */
  surface_form: string | Uint8Array;
  /** 品詞 */
  pos: string;
  /** 品詞細分類1 */
  pos_detail_1: string;
  /** 品詞細分類2 */
  pos_detail_2: string;
  /** 品詞細分類3 */
  pos_detail_3: string;
  /** 活用型 */
  conjugated_type: string;
  /** 活用形 */
  conjugated_form: string;
  /** 基本形 */
  basic_form: string;
  /** 読み */
  reading?: string;
  /** 発音 */
  pronunciation?: string;
}

class IpadicFormatter {
  /**
   * Mappings between IPADIC dictionary features and tokenized results
   * @constructor
   */
  constructor() {}

  formatEntry(
    word_id: number,
    position: number,
    type: ViterbiNodeType,
    features: string[]
  ): IpadicFormatterToken {
    let token: IpadicFormatterToken = {
      word_id,
      word_type: type,
      word_position: position,

      surface_form: features[0],
      pos: features[1],
      pos_detail_1: features[2],
      pos_detail_2: features[3],
      pos_detail_3: features[4],
      conjugated_type: features[5],
      conjugated_form: features[6],
      basic_form: features[7],
      reading: features[8],
      pronunciation: features[9],
    };

    return token;
  }

  formatUnknownEntry(
    word_id: number,
    position: number,
    type: ViterbiNodeType,
    features: string[],
    surface_form: string | Uint8Array
  ): IpadicFormatterToken {
    let token: IpadicFormatterToken = {
      word_id,
      word_type: type,
      word_position: position,

      surface_form: surface_form,
      pos: features[1],
      pos_detail_1: features[2],
      pos_detail_2: features[3],
      pos_detail_3: features[4],
      conjugated_type: features[5],
      conjugated_form: features[6],
      basic_form: features[7],
      // reading: features[8],
      // pronunciation: features[9],
    };
    return token;
  }
}

export default IpadicFormatter;
