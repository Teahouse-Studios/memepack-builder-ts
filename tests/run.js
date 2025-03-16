const a = require('../lib')
const fs = require('node:fs')
const javaParser = new a.ModuleParser()
javaParser.addSearchPaths('./java/modules')
javaParser.searchModules().then((m) => {
  const builder = new a.JavaPackBuilder(m, './java/modules/priority.txt', './java/mappings/al.json')
  const options = {
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
  builder.build(options).then((buffer) => {
    fs.open('./out/java.zip', 'w', (_err, fd) => {
      fs.write(fd, buffer, () => {
        fs.close(fd, () => {
          console.log('generated java.zip')
        })
      })
    })
  })
})
const bedrockParser = new a.ModuleParser()
bedrockParser.addSearchPaths('./bedrock/modules')
bedrockParser.searchModules().then((m) => {
  const builder = new a.BedrockPackBuilder(m, './bedrock/modules/priority.txt')
  const options = {
    platform: 'bedrock',
    type: 'normal',
    compatible: false,
    hash: false,
    modules: {
      resource: ['meme_resourcepack', 'bagify'],
      collection: ['sound_modules'],
    },
  }
  builder.build(options).then((buffer) => {
    fs.open('./out/bedrock.zip', 'w', (_err, fd) => {
      fs.write(fd, buffer, () => {
        fs.close(fd, () => {
          console.log('generated bedrock.zip')
        })
      })
    })
  })
})
