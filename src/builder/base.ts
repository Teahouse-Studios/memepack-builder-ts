/**
 * @method PackBuilder
 * @param {Object}
 */

import fs from 'fs';
import { createHash } from 'crypto';
import { zip } from 'compressing';
import { BuilderConfig, BuildOptions, ModuleOverview } from '../types';
import { defaultConfig } from '../constants/defaultConfig';

export class PackBuilder {
    config: BuilderConfig;
    resourcePath: string;
    moduleOverview: ModuleOverview;
    options: BuildOptions;
    log: string[] = [];

    constructor(resourcePath: string, moduleOverview: ModuleOverview, options: BuildOptions) {
        this.config = fs.existsSync(`${process.env.HOME}/.memepack-builder.config.json`) ?
            JSON.parse(fs.readFileSync(`${process.env.HOME}/.memepack-builder.config.json`, { encoding: 'utf8' })) :
            defaultConfig;
        this.resourcePath = resourcePath;
        this.moduleOverview = moduleOverview;
        this.options = options;
    }

    _appendLog(entry: string | string[]): void {
        this.log.push(...entry);
    }

    async _build(extraFiles: string[] = [], extraContent: Record<string, string> = {}, excludedFileNames: string[] = []): Promise<void> {
        excludedFileNames.push('add.json', 'remove.json', 'module_manifest.json');
        const modulePath = this.moduleOverview.modulePath;
        const validModules = this.moduleOverview.modules.resource.map(value => {
            return value.name;
        });
        const zipStream = new zip.Stream();
        const modules = this.options.modules.resource;
        for (const file of extraFiles) {
            zipStream.addEntry(`${this.resourcePath}/${file}`, { relativePath: `${file}` });
        }
        for (const entry in extraContent) {
            if (extraContent[entry] !== '') {
                zipStream.addEntry(Buffer.from(extraContent[entry], 'utf8'), { relativePath: entry });
            }
        }
        for (const module of modules) {
            if (!validModules.includes(module)) {
                this._appendLog(`Warning: Module "${module}" does not exist, skipping.`);
                continue;
            }
            const fileList: string[] = [];
            const destFileList: string[] = [];
            this._readFileList(`${modulePath}/${module}/`, fileList);
            const re = new RegExp(`${excludedFileNames.join('|')}$`, 'g');
            for (const file of fileList) {
                if (re.test(file)) {
                    continue;
                }
                const destFilePath = file.replace(`${modulePath}/${module}/`, '');
                if (!destFileList.includes(destFilePath)) {
                    zipStream.addEntry(file, { relativePath: destFilePath });
                    destFileList.push(destFilePath);
                }
                else {
                    this._appendLog(`Warning: Duplicated "${destFilePath}", skipping.`);
                }
            }
        }

        let name = this.options.output;
        if (this.options?.hash) {
            const hash = createHash('sha256').update(JSON.stringify(this.options), 'utf8').digest('hex').slice(0, 7);
            name = name.replace(/\.(\w+)$/ig, `.${hash}.$1`);
        }

        zipStream.pipe(fs.createWriteStream(`${name}`, { flags: 'w', encoding: 'utf8' }));
    }

    _readFileList(path: string, fileList: string[]): void {
        for (const file of fs.readdirSync(path)) {
            const stat = fs.statSync(`${path}${file}`);
            if (stat.isDirectory()) {
                this._readFileList(`${path}${file}/`, fileList);
            }
            if (stat.isFile()) {
                fileList.push(`${path}${file}`);
            }
        }
    }

    mergeCollectionIntoResource(): void {
        const selectedCollections = this.options.modules.collection || [];
        const selectedResources = this.options.modules.resource;
        const collections = this.moduleOverview.modules.collection;
        for (const item of selectedCollections) {
            const target = collections.find(value => {
                return value.name === item;
            });
            if (!target) {
                this._appendLog(`Warning: Module "${item}" does not exist, skipping.`);
                continue;
            }
            for (const containedModule of target?.contains || []) {
                if (!selectedResources.includes(containedModule)) {
                    selectedResources.push(containedModule);
                }
            }
        }
    }
}