
import { readFile } from 'fs';
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
        for (const option of beRequiredOptions) {
            if (!options.hasOwnProperty(option)) {
                this._appendLog(`Warning: Missing required argument "${option}".`);
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
            'textures/item_texture.json': await this.getTexture('item_texture.json'),
            'textures/terrain_texture.json': await this.getTexture('terrain_texture.json')
        };
        await this._addLanguage(extraFiles, extraContent);
        await this._build(extraFiles, extraContent, ['item_texture.json', 'terrain_texture.json']);
    }

    async getTexture(textureFileName: string): Promise<string> {
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

    async getLanguageContent(langFilePath: string, withModules: boolean): Promise<string> {
        const result = await generateBedrock(`${this.resourcePath}/${langFilePath}`, withModules, this.moduleOverview, this.options.modules.resource);
        result.log.forEach(element => {
            this._appendLog(element);
        });
        return result.content;
    }

    _normalizeOptions(): void {
        const options = this.options;
        options.output = `${options.output}/${defaultFileName}.${options.type}`;
    }

    async _addLanguage(fileList: string[], contentList: Record<string, string>): Promise<void> {
        const langContent = await this.getLanguageContent('texts/zh_ME.lang', true);
        if (this.options.compatible) {
            contentList['texts/zh_CN.lang'] = langContent;
        }
        else {
            fileList.push('texts/language_names.json', 'texts/languages.json', 'texts/zh_CN.lang')
            contentList['texts/zh_ME.lang'] = langContent;
        }
    }
}