const a = await import('../lib/index.js')
const fs = await import('node:fs/promises')

if (!(await fs.stat('./out').catch(() => false))) {
  await fs.mkdir('./out')
}

let parser = new a.ModuleParser()
parser.addSearchPaths('./java/modules')
let modules = await parser.searchModules()
let builder = new a.JavaPackBuilder(
  modules,
  './java/modules/priority.txt',
  './java/mappings/al.json'
)
const javaOptions = {
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
}
let buffer = await builder.build(javaOptions)
let fd = await fs.open('./out/java.zip', 'w')
await fs.writeFile(fd, buffer)
console.log('generated java.zip')

parser = new a.ModuleParser()
parser.addSearchPaths('./bedrock/modules')
modules = await parser.searchModules()
builder = new a.BedrockPackBuilder(modules, './bedrock/modules/priority.txt')
const bedrockOptions = {
  platform: 'bedrock',
  type: 'normal',
  compatible: false,
  hash: false,
  modules: {
    resource: ['meme_resourcepack', 'bagify'],
    collection: ['sound_modules'],
  },
}
buffer = await builder.build(bedrockOptions)
fd = await fs.open('./out/bedrock.zip', 'w')
await fs.writeFile(fd, buffer)
console.log('generated bedrock.zip')
