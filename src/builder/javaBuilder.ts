import { BuildOptions, ModuleOverview } from '../types';
import { generateJavaLegacy, generateJSON } from '../util/languageGenerator';
import { PackBuilder } from './base';

export class JavaBuilder extends PackBuilder {
    modPath: string;

    /**
     *
     */
    constructor(resourcePath: string, moduleOverview: ModuleOverview, modPath: string, options: BuildOptions) {
        super(resourcePath, moduleOverview, options);
        this.modPath = modPath;
    }

    validateOptions(): boolean {
        const latestJEPackFormat = this.config.latestJEPackFormat;
        const legacyJEPackFormat = this.config.legacyJEPackFormat;
        const jeRequiredOptions = ['type', 'modules', 'mod', 'output', 'hash'];
        const options = this.options;
        for (const option of jeRequiredOptions) {
            if (!options.hasOwnProperty(option)) {
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
        this._normalizeOptions();
        this.mergeCollectionIntoResource();
        const extraFiles = ['pack.png', 'LICENSE'];
        const extraContent: Record<string, string> = {};
        await this._addLanguage(extraFiles, extraContent);
        await this._build(extraFiles, extraContent);
    }

    async getLanguageContent(langFilePath: string, withModules: boolean): Promise<string> {
        const options = this.options;
        const languageModules = options.modules.resource.filter(name => {
            const target = this.moduleOverview.modules.resource.find(value => {
                return value.name === name && value.classifier.includes('modified_language');
            });
            return target?.name;
        });
        if (['normal', 'compat'].includes(options.type)) {
            const result = await generateJSON(langFilePath, withModules, this.moduleOverview, languageModules, options.mod);
            this._appendLog(result.log);
            return result.content;
        }
        else if (options.type === 'legacy') {
            const result = await generateJavaLegacy(langFilePath, withModules, this.moduleOverview, languageModules, options.mod);
            this._appendLog(result.log);
            return result.content;
        }
        else {
            return '';
        }
    }

    _normalizeOptions(): void {
        const options = this.options;
        if (options.mod) {
            options.mod = options.mod.map(value => {
                return `${this.modPath}/${value}`;
            });
        }
        options.output = `${options.output}/${this.config.defaultFileName}.zip`;
    }

    async _addLanguage(fileList: string[], contentList: Record<string, string>): Promise<void> {
        switch (this.options.type) {
            case 'normal':
                fileList.push('pack.mcmeta');
                contentList['assets/minecraft/lang/zh_meme.json'] = await this.getLanguageContent(`${this.resourcePath}/assets/minecraft/lang/zh_meme.json`, true);
                contentList['assets/realms/lang/zh_meme.json'] = await this.getLanguageContent(`${this.resourcePath}/assets/realms/lang/zh_meme.json`, false);
                break;
            case 'compat':
                contentList['pack.mcmeta'] = JSON.stringify(this._processMcMetaFile(), null, 4);
                contentList['assets/minecraft/lang/zh_cn.json'] = await this.getLanguageContent(`${this.resourcePath}/assets/minecraft/lang/zh_meme.json`, true);
                contentList['assets/realms/lang/zh_cn.json'] = await this.getLanguageContent(`${this.resourcePath}/assets/realms/lang/zh_cn.json`, false)
                break;
            case 'legacy':
                contentList['pack.mcmeta'] = JSON.stringify(this._processMcMetaFile(), null, 4);
                contentList['assets/minecraft/lang/zh_cn.lang'] = await this.getLanguageContent(`${this.resourcePath}/assets/minecraft/lang/zh_meme.json`, true);
                contentList['assets/realms/lang/zh_cn.lang'] = await this.getLanguageContent(`${this.resourcePath}/assets/realms/lang/zh_cn.lang`, false);
                break;
            default:
                break;
        }
    }

    _processMcMetaFile(): any {
        const parsedData: any = require(`${this.resourcePath}/pack.mcmeta`);
        const type = this.options.type;
        if (type === 'compat') {
            delete parsedData.language;
        }
        const packFormat = type === 'legacy' ? this.config.legacyJEPackFormat : this.options.format;
        parsedData.pack.pack_format = packFormat || this.config.latestJEPackFormat;
        return parsedData;
    }
}