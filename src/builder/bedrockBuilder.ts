
import { readFile } from 'node:fs';
import { BedrockTextureFile, BuildOptions, ModuleOverview } from '../types';
import { generateBedrock } from '../util/languageGenerator';
import { packBuilder } from './base'

// TODO: move these default settings to config
const defaultFileName = 'meme-resourcepack';

export class bedrockBuilder extends packBuilder {
    /**
     *
     */
    constructor(resourcePath: string, moduleOverview: ModuleOverview, options: BuildOptions) {
        super(resourcePath, moduleOverview, options);
    }

    validateOptions(): boolean {
        const beRequiredOptions = ['type', 'compatible', 'modules', 'output', 'hash'];
        const options = this.options;
        for (const option in options) {
            if (!beRequiredOptions.includes(option)) {
                this._appendLog(`Error: Missing required argument "${option}".`);
                return false;
            }
        }
        return true;
    }

    async build(): Promise<void> {
        if (!this.validateOptions()) {
            return;
        }
        this._normalizeOptions();
        this.mergeCollectionIntoResource();
        const extraFiles = ['pack_icon.png', 'LICENSE', 'manifest.json', 'textures/map/map_background.png'];
        const extraContent = {
            'textures/item_texture.json': this.getTexture('item_texture.json'),
            'textures/terrain_texture.json': this.getTexture('terrain_texture.json')
        };
        this._addLanguage(extraFiles, extraContent);
        await this._build(extraFiles, extraContent, ['item_texture.json', 'terrain_texture.json']);
    }

    getTexture(textureFileName: string): string {
        const texture: BedrockTextureFile = { texture_data: {} };
        for (const module of this.options.modules.resource) {
            const path = `${this.moduleOverview.modulePath}/${module}/${textureFileName}`;
            readFile(path, { encoding: 'utf8' }, (err, data) => {
                if (err) {
                    this._appendLog(err.message);
                    return;
                }
                const parsedData = JSON.parse(data);
                for (const k in parsedData) {
                    texture.texture_data[k] = parsedData[k];
                }
            });
        }
        return JSON.stringify(texture);
    }

    getLanguageContent(langFilePath: string): string {
        return generateBedrock(`${this.resourcePath}/${langFilePath}`, this.moduleOverview, this.options.modules.resource)
    }

    _normalizeOptions(): void {
        const options = this.options;
        options.output = `${options.output}/${defaultFileName}.${options.type}`;
    }

    _addLanguage(fileList: string[], contentList: Record<string, string>): void {
        const langContent = this.getLanguageContent('texts/zh_ME.lang');
        if (this.options.compatible) {
            contentList['texts/zh_CN.lang'] = langContent;
        }
        else {
            fileList.push('texts/language_names.json', 'texts/languages.json', 'texts/zh_CN.lang')
            contentList['texts/zh_ME.lang'] = langContent;
        }
    }
}