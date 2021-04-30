/**
 * @name memepack-builder
 * @description A resourcepack builder using ts
 * 
 * @author MysticNebula70
 * @license Apache-2.0
 */

import { resolve } from 'path';
import { bedrockBuilder } from './builder/bedrockBuilder';
import { javaBuilder } from './builder/javaBuilder';
import { moduleChecker } from './moduleChecker/base';
import * as types from './types';

// name
export const name = 'memepack-builder';
export { bedrockBuilder } from './builder/bedrockBuilder';
export { javaBuilder } from './builder/javaBuilder';
export { moduleChecker } from './moduleChecker/base';

export class test {
    async test(): Promise<void> {
        const checker = new moduleChecker(resolve(__dirname.replace(/(?:\\|\/)dist/g, ''), 'tests/java/modules'));
        const options: types.BuildOptions = {
            platform: 'je',
            type: 'normal',
            output: resolve(__dirname.replace(/(?:\\|\/)dist/g, ''), 'builds'),
            modules: {
                resource: ['a_letter', 'nonexistent_1'],
                collection: ['choice_modules_1', 'nonexistent_2']
            },
            mod: ['adorn', 'nonexistent_3'],
            hash: true
        }
        const builder = new javaBuilder(resolve(__dirname.replace(/(?:\\|\/)dist/g, ''), 'tests/java/meme_resourcepack'), checker.validateModules(), resolve(__dirname, 'tests/java/mods'), options);
        console.log('start');
        await builder.build();
        const log = checker.log.concat(builder.log);
        console.log('finish');
        console.log(...log);
    }
    async test2(): Promise<void> {
        const checker = new moduleChecker(resolve(__dirname.replace(/(?:\\|\/)dist/g, ''), 'tests/bedrock/modules'));
        const options: types.BuildOptions = {
            platform: 'be',
            type: 'mcpack',
            output: resolve(__dirname.replace(/(?:\\|\/)dist/g, ''), 'builds'),
            modules: {
                resource: ['a_letter', 'nonexistent_1'],
                collection: ['blue_ui', 'nonexistent_2']
            },
            compatible: false,
            hash: true
        }
        const builder = new bedrockBuilder(resolve(__dirname.replace(/(?:\\|\/)dist/g, ''), 'tests/bedrock/meme_resourcepack'), checker.validateModules(), options);
        console.log('start');
        await builder.build();
        const log = checker.log.concat(builder.log);
        console.log('finish');
        console.log(...log);
    }
}

new test().test();
new test().test2();