import fse from 'fs-extra'
import path from 'path'
import { JavaBuildOptions } from '../../types'

export async function getMcMetaFile(
  baseResourcePath: string,
  options: JavaBuildOptions
): Promise<string> {
  const file = await fse.readJSON(
    path.resolve(baseResourcePath, 'pack.mcmeta'),
    { encoding: 'utf8' }
  )
  if (options.compatible) {
    delete file.language
  }
  if (options.format) {
    file.pack.pack_format = options.format
  }
  return JSON.stringify(file, null, 4)
}
