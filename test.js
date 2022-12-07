const a = require('./lib')
const fs = require('fs')
const p1 = new a.ModuleParser()
p1.addSearchPaths('./java/modules')
p1.searchModules().then((m) => {
  const b = new a.JavaPackBuilder(m, './java/modules/priority.txt', './java/mappings/al.json')
  const o = {
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
  b.build(o).then((b) => {
    console.log(b)
    const f = fs.openSync('./out1.zip', 'w')
    fs.writeSync(f, b)
    fs.closeSync(f)
  })
})
const p2 = new a.ModuleParser()
p2.addSearchPaths('./bedrock/modules')
p2.searchModules().then((m) => {
  const b = new a.BedrockPackBuilder(m, './bedrock/modules/priority.txt')
  const o = {
    platform: 'bedrock',
    type: 'normal',
    compatible: false,
    hash: false,
    modules: {
      resource: ['meme_resourcepack', 'bagify'],
      collection: ['sound_modules'],
    },
  }
  b.build(o).then((b) => {
    console.log(b)
    const f = fs.openSync('./out2.zip', 'w')
    fs.writeSync(f, b)
    fs.closeSync(f)
  })
})
