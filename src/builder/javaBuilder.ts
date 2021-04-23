import { readFile } from 'node:fs';
import { BuildOptions, ModuleOverview } from '../types';
import { generateJavaLegacy, generateJSON } from '../util/languageGenerator';
import { packBuilder } from './base';

const latestJEPackFormat = 7;
const legacyJEPackFormat = 3;

export class javaBuilder extends packBuilder {
    defaultFileName = 'meme-resourcepack';
    modPath: string;

    /**
     *
     */
    constructor(resourcePath: string, moduleOverview: ModuleOverview, modPath: string, options: BuildOptions) {
        super(resourcePath, moduleOverview, options);
        this.modPath = modPath;
    }

    validateOptions(): boolean {
        const jeRequiredOptions = ['type', 'modules', 'mod', 'output', 'hash'];
        const options = this.options;
        for (const option in options) {
            if (!jeRequiredOptions.includes(option)) {
                this._appendLog(`Warning: Missing required argument "${option}".`);
                return false;
            }
        }
        // validate 'format' option
        if (options.format === undefined) {
            options.format = options.type === 'legacy' ? legacyJEPackFormat : latestJEPackFormat;
            this._appendLog(`Warning: Did not specify "pack_format". Assuming value is "${options.format}".`)
        }
        else {
            if ((options.type === 'legacy' && options.format !== legacyJEPackFormat)
                || (['normal', 'compat'].includes(options.type) && options.format <= legacyJEPackFormat)) {
                this._appendLog(`Error: Type "${options.type}" does not match pack_format ${options.format}.`)
                return false;
            }
        }
        return true;
    }

    async build(): Promise<void> {
        if (!this.validateOptions()) {
            return;
        }
        this.options.output = `${this.options.output}/${this.defaultFileName}.zip`;
        this.mergeCollectionIntoResource();
        const extraFiles = ['pack.png', 'LICENSE'];
        const extraContent: Record<string, string> = {};
        this._addLanguage(extraFiles, extraContent);
        await this._build(extraFiles, extraContent);
    }

    _addLanguage(fileList: string[], contentList: Record<string, string>): void {
        switch (this.options.type) {
            case 'normal':
                fileList.push('pack.mcmeta');
                contentList['assets/minecraft/lang/zh_meme.json'] = this.getLanguageContent(`${this.resourcePath}/assets/minecraft/lang/zh_meme.json`);
                break;
            case 'compat':
                contentList['assets/minecraft/lang/zh_cn.json'] = this.getLanguageContent(`${this.resourcePath}/assets/minecraft/lang/zh_meme.json`);
                contentList['pack.mcmeta'] = JSON.stringify(this._processMcMetaFile());
                break;
            case 'legacy':
                contentList['assets/minecraft/lang/zh_cn.lang'] = this.getLanguageContent(`${this.resourcePath}/assets/minecraft/lang/zh_meme.json`);
                contentList['pack.mcmeta'] = JSON.stringify(this._processMcMetaFile());
                break;
            default:
                break;
        }
    }

    _processMcMetaFile(): any {
        const mcmetaFile = `${this.resourcePath}/pack.mcmeta`;
        let parsedData: any;
        readFile(mcmetaFile, { encoding: 'utf8' }, (err, data) => {
            if (err) {
                this._appendLog(err.message);
                return;
            }
                parsedData = JSON.parse(data);
                if (this.options.type === 'compat') {
                    delete parsedData.language;
                }
                const packFormat = this.options.type === 'legacy' ? 3 : this.options.format;
                // TODO: move this number to config
                parsedData.pack.pack_format = packFormat || 7;
        });
        return parsedData;
    }

    getLanguageContent(langFilePath: string): string {
        if (['normal', 'compat'].includes(this.options.type)) {
            return generateJSON(langFilePath, this.moduleOverview, this.options.modules.resource, this.options.mod);
        }
        else if (this.options.type === 'legacy') {
            return generateJavaLegacy(langFilePath, this.moduleOverview, this.options.modules.resource, this.options.mod);
        }
        else {
            return '';
        }
    }
}