const a = await import('../lib/index.js')
const fs = await import('node:fs/promises')

if (!(await fs.stat('./out').catch(() => false))) {
  await fs.mkdir('./out')
}

const javaOptions = [
  {
    platform: 'java',
    type: 'normal',
    format: 9,
    compatible: false,
    hash: false,
    mod: [],
    modules: {
      resource: ['meme_resourcepack', 'a_letter', 'bagify'],
      collection: ['version_1.18.2'],
    },
  },
  {
    platform: 'java',
    type: 'compatible',
    format: 9,
    compatible: true,
    hash: false,
    mod: [],
    modules: {
      resource: ['meme_resourcepack', 'a_letter', 'bagify'],
      collection: ['version_1.18.2'],
    },
  },
  {
    platform: 'java',
    type: 'legacy',
    format: 3,
    compatible: true,
    hash: false,
    mod: [],
    modules: {
      resource: ['meme_resourcepack', 'lang_sfw'],
      collection: ['version_1.12.2-1.15.2'],
    },
  },
]

export async function TestJava() {
  const parser = new a.ModuleParser()
  parser.addSearchPaths('./java/modules')
  const modules = await parser.searchModules()
  await generateAllMappings()
  const builder = new a.JavaPackBuilder(
    modules,
    './java/modules/priority.txt',
    './java/mappings/al.json'
  )
  for (const option of javaOptions) {
    const buffer = await builder.build(option)
    const filename = `./out/java-${option.type}.zip`
    const fd = await fs.open(filename, 'w')
    await fs.writeFile(fd, buffer)
    await fd.close()
    console.log(`generated ${filename}`)
  }
}

export async function generateAllMappings() {
  const fd = await fs.open('./java/mappings/al.json', 'w')
  const m = {}
  const keys = JSON.parse(await fs.readFile('./java/mappings/all_mappings', { encoding: 'utf-8' }))
  for (const key of keys) {
    const content = JSON.parse(
      await fs.readFile(`./java/mappings/${key}.json`, { encoding: 'utf-8' })
    )
    Object.assign(m, content)
  }
  await fs.writeFile(fd, JSON.stringify(m, null, 2))
  await fd.close()
}
