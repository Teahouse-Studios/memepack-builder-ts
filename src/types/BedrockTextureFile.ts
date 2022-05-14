export type BedrockTextureFileType =
  | 'item_texture.json'
  | 'terrain_texture.json'

export interface BedrockTextureFile {
  texture_data: Record<string, unknown>
}
