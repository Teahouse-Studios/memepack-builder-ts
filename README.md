# memepack-builder-ts

[简体中文](./doc/README.zh-hans.md)

This library provides a builder for packing Memified Chinese Resourcepack.

## Installation

```bash
# npm
npm install memepack-builder
# yarn
yarn add memepack-builder
```

## Usage

### `class MemepackBuilder(platform: 'je' | 'be', resourcePath: string, modulePath: string, buildOptions?: BuildOptions, modPath?: string)`

Main wrapper class for building packs.

#### `MemepackBuilder.build(clearLog = true): Promise<{ name: string; buf: Buffer }>`

Build method. If `clearLog` is true, will clear previous build logs. Default is true.

Returns a `Promise` which will return pack name and content (as a `Buffer`) when fulfilled.

#### `MemepackBuilder.builder: JavaBuilder | BedrockBuilder`

The real builder. Build options are passed to this builder. If you want to change build options after an instance created, change `<instanceName>.builder.options`.

#### `MemepackBuilder.log: string[]`

Build logs.

### Example

``` js
const module = require('memepack-builder')
const options = {
  type: 'normal',
  modules: {
    resource: [],
    collection: []
  },
  mod: [],
  sfw: true,
  outputDir: '/path/to/output/directory',
  format: 7,
  hash: true
}
const builder = new module.MemepackBuilder(
  'je',
  '/path/to/main/resources/',
  '/path/to/modules/',
  options,
  '/path/to/mods/'
)
const { name, buf } = await builder.build()
```

## License

> Copyright 2021 MysticNebula70 & Teahouse Studios
>
> Licensed under the Apache License, Version 2.0 (the "License");
> you may not use this file except in compliance with the License.
> You may obtain a copy of the License at
>
> http://www.apache.org/licenses/LICENSE-2.0
>
> Unless required by applicable law or agreed to in writing, software
> distributed under the License is distributed on an "AS IS" BASIS,
> WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
> See the License for the specific language governing permissions and
> limitations under the License.
