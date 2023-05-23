import fse from 'fs-extra'
import path from 'path'
import type { BedrockTextureFile, ResourceModule } from '../types'

/**
 *
 * @param textureFileName - output file name
 * @param selectedModules - generate file from these modules
 * @returns
 * @public
 */
export async function getBedrockTextureFile(
  textureFileName: string,
  selectedModules: ResourceModule[]
): Promise<BedrockTextureFile> {
  const texture: BedrockTextureFile = { texture_data: {} }
  selectedModules.forEach(async (module) => {
    const targetPath = path.resolve(module.path, 'textures', textureFileName)
    if (fse.existsSync(targetPath)) {
      Object.assign(
        texture.texture_data,
        (
          await fse.readJSON(targetPath, {
            encoding: 'utf8',
          })
        ).texture_data
      )
    }
  })
  return texture
}
