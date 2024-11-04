import TokenInfoDictionary from "./TokenInfoDictionary";
import CharacterDefinition from "./CharacterDefinition";
import ByteBuffer from "../util/ByteBuffer";

// Inherit from TokenInfoDictionary as a super class
class UnknownDictionary extends TokenInfoDictionary {
  dictionary: ByteBuffer;
  target_map: { [key: string]: number[] };
  pos_buffer: ByteBuffer;
  character_definition: CharacterDefinition | null;

  /**
   * UnknownDictionary
   * @constructor
   */
  constructor() {
    super();
    this.dictionary = new ByteBuffer(10 * 1024 * 1024);
    this.target_map = {}; // class_id (of CharacterClass) -> token_info_id (of unknown class)
    this.pos_buffer = new ByteBuffer(10 * 1024 * 1024);
    this.character_definition = null;
  }

  // Inherit from TokenInfoDictionary as a super class
  // UnknownDictionary.prototype = Object.create(TokenInfoDictionary.prototype);

  characterDefinition(character_definition: CharacterDefinition) {
    this.character_definition = character_definition;
    return this;
  }

  lookup(ch: string) {
    return this.character_definition?.lookup(ch);
  }

  lookupCompatibleCategory(ch: string) {
    return this.character_definition?.lookupCompatibleCategory(ch);
  }

  loadUnknownDictionaries(
    unk_buffer: Uint8Array,
    unk_pos_buffer: Uint8Array,
    unk_map_buffer: Uint8Array,
    cat_map_buffer: Uint8Array,
    compat_cat_map_buffer: Uint32Array,
    invoke_def_buffer: Uint8Array
  ) {
    this.loadDictionary(unk_buffer);
    this.loadPosVector(unk_pos_buffer);
    this.loadTargetMap(unk_map_buffer);
    this.character_definition = CharacterDefinition.load(
      cat_map_buffer,
      compat_cat_map_buffer,
      invoke_def_buffer
    );
  }
}

export default UnknownDictionary;
