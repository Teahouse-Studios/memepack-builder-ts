const a = await import('../lib/index.js')
const fs = await import('node:fs/promises')

if (!(await fs.stat('./out').catch(() => false))) {
  await fs.mkdir('./out')
}

export async function TestBedrock() {
  const parser = new a.ModuleParser()
  parser.addSearchPaths('./bedrock/modules')
  const modules = await parser.searchModules()
  const builder = new a.BedrockPackBuilder(modules, './bedrock/modules/priority.txt')
  const bedrockOptions = [
    {
      platform: 'bedrock',
      type: 'mcpack',
      compatible: false,
      modules: {
        resource: ['meme_resourcepack'],
        collection: [],
      },
    },
    {
      platform: 'bedrock',
      type: 'zip',
      compatible: true,
      modules: {
        resource: ['meme_resourcepack'],
        collection: [],
      },
    },
  ]
  for (const option of bedrockOptions) {
    const buffer = await builder.build(option)
    const filename = `bedrock-${option.compatible ? 'compatible' : 'normal'}.${option.type}`
    const fd = await fs.open(`./out/${filename}`, 'w')
    await fs.writeFile(fd, buffer)
    await fd.close()
    console.log(`generated ${filename}`)
  }
}
