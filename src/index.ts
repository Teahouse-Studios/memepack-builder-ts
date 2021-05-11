/**
 * @name memepack-builder
 * @description A resourcepack builder using ts
 * 
 * @author MysticNebula70
 * @license Apache-2.0
 */

import { BedrockBuilder } from './builder/bedrockBuilder';
import { JavaBuilder } from './builder/javaBuilder';
import { ModuleChecker } from './moduleChecker/base';
import { BuildOptions } from './types';

// name
export const name = 'memepack-builder';
export { BedrockBuilder } from './builder/bedrockBuilder';
export { JavaBuilder } from './builder/javaBuilder';
export { ModuleChecker } from './moduleChecker/base';
export * as util from './util';

export class MemepackBuilder {
    builder: BedrockBuilder | JavaBuilder;
    moduleChecker: ModuleChecker;
    log: string[];

    constructor(platform: 'je' | 'be', resourcePath: string, modulePath: string, buildOptions: BuildOptions, modPath?: string) {
        this.log = []
        this.moduleChecker = new ModuleChecker(modulePath);
        const overview = this.moduleChecker.validateModules();
        this.log.push(...this.moduleChecker.log);
        switch (platform) {
            case 'be':
                this.builder = new BedrockBuilder(resourcePath, overview, buildOptions);
                break;
            case 'je':
            default:
                modPath = modPath || '';
                this.builder = new JavaBuilder(resourcePath, overview, modPath, buildOptions);
                break;
        }
    }

    async build(): Promise<void> {
        await this.builder.build();
        this.log.push(...this.builder.log);
    }
}