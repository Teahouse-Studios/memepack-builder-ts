const m = require('.')
const options1 = {
  type: 'normal',
  modules: {
    resource: [],
    collection: ['version_1.16', 'choice_modules_1'],
  },
  mod: [],
  sfw: true,
  outputDir: 'builds',
  format: 7,
  hash: true,
}
const builder1 = new m.MemepackBuilder({
  platform: 'je',
  resourcePath: 'tests/java/meme_resourcepack',
  modulePath: 'tests/java/modules',
  buildOptions: options1,
  modPath: 'tests/java/mods',
})
builder1.build().then(({ name, buf }) => {
  console.log(name)
  console.log(buf)
})
const options2 = {
  type: 'mcpack',
  modules: {
    resource: [],
    collection: ['choice_modules_1'],
  },
  compatible: false,
  outputDir: 'builds',
  hash: true,
}
const builder2 = new m.MemepackBuilder({
  platform: 'be',
  resourcePath: 'tests/bedrock/meme_resourcepack',
  modulePath: 'tests/bedrock/modules',
  buildOptions: options2,
})
builder2.build().then(({ name, buf }) => {
  console.log(name)
  console.log(buf)
})
