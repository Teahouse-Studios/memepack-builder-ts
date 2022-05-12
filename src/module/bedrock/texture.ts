import fse from 'fs-extra'
import path from 'path'
import {
  BedrockTextureFile,
  BedrockTextureFileType,
  ModuleManifestWithDirectory,
} from '~/types'

export async function getBedrockTextureFile(
  textureFileName: BedrockTextureFileType,
  moduleDirectory: string,
  selectedModules: ModuleManifestWithDirectory[]
): Promise<string> {
  const texture: BedrockTextureFile = { texture_data: {} }
  for (const module of selectedModules) {
    try {
      Object.assign(
        texture.texture_data,
        (
          await fse.readJSON(
            path.resolve(
              moduleDirectory,
              module.directory,
              'textures',
              textureFileName
            ),
            { encoding: 'utf8' }
          )
        ).texture_data
      )
    } catch (e) {
      // console.error(e)
    }
  }
  if (!Object.keys(texture.texture_data).length) {
    return ''
  } else {
    return JSON.stringify(texture, null, 4)
  }
}
