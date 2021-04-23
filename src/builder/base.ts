/**
 * @method packBuilder
 * @param {Object}
 */

import * as fs from 'fs';
import { createHash } from 'crypto';
import { zip } from 'compressing';
import { BuildOptions, ModuleOverview } from '../types';

export class packBuilder {
    resourcePath: string;
    moduleOverview: ModuleOverview;
    options: BuildOptions;
    log: string[] = [];

    constructor(resourcePath: string, moduleOverview: ModuleOverview, options: BuildOptions) {
        this.resourcePath = resourcePath;
        this.moduleOverview = moduleOverview;
        this.options = options;
    }

    _appendLog(entry: string): void {
        this.log.push(entry);
    }

    async _build(extraFiles?: string[], extraContent?: Record<string, string>, excludedFileNames?: string[]): Promise<void> {
        excludedFileNames = excludedFileNames || [];
        excludedFileNames.push('add.json', 'remove.json', 'module_manifest.json');
        const modulePath = this.moduleOverview.modulePath;
        const zipStream = new zip.Stream();

        extraFiles = extraFiles || [];
        const modules = this.options.modules.resource;
        extraContent = extraContent || {};

        for (const file of extraFiles) {
            zipStream.addEntry(`${this.resourcePath}/${file}`, { relativePath: `${file}` });
        }
        for (const file in extraContent) {
            if (extraContent[file] !== '') {
                zipStream.addEntry(Buffer.from(extraContent[file], 'utf8'), { relativePath: file });
            }
        }
        for (const module of modules) {
            const fileList: string[] = [];
            const destFileList: string[] = [];
            await this._readFileList(`${modulePath}/${module}/`, fileList);
            for (const file of fileList) {
                for (const exclude of excludedFileNames) {
                    if (file.endsWith(exclude)) {
                        continue;
                    }
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
            const hash = createHash('sha256').update(this.options.toString(), 'utf8').digest('hex').slice(0, 7);
            name = name.replace(/\.(\w+)$/ig, `.${hash}.$1`);
        }

        zipStream.pipe(fs.createWriteStream(`${name}`));
    }

    async _readFileList(path: string, fileList: string[]): Promise<void> {
        fs.readdir(path, async (err, files) => {
            if (err) {
                this._appendLog(err.message);
                return;
            }
            for (const file of files) {
                fs.stat(`${path}${file}`, async (err, stats) => {
                    if (err) {
                        this._appendLog(err.message);
                        return;
                    }
                    if (stats.isDirectory()) {
                        await this._readFileList(`${path}${file}/`, fileList);
                    }
                    if (stats.isFile()) {
                        fileList.push(`${path}${file}`);
                    }
                });
            }
        });
    }

    mergeCollectionIntoResource(): void {
        const selectedCollection = this.options.modules.collection || [];
        const resource = this.options.modules.resource;
        for (const item of this.moduleOverview.modules.collection.filter((value) => {
            return selectedCollection.includes(value.name);
        })) {
            for (const containedModule of item.contains || []) {
                if (!resource.includes(containedModule)) {
                    resource.push(containedModule);
                }
            }
        }
    }
}