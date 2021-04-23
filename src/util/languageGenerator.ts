import { readFile } from "node:fs";
import { ModuleOverview } from "../types";

export function generateJSON(filePath: string, moduleOverview: ModuleOverview, modules?: string[], modFiles?: string[]): string {
    return new languageGenerator(filePath, moduleOverview, modules, modFiles).generateJSON();
}

export function generateJavaLegacy(filePath: string, moduleOverview: ModuleOverview, modules?: string[], modFiles?: string[]): string {
    return new languageGenerator(filePath, moduleOverview, modules, modFiles).generateJavaLegacy();
}

export function generateBedrock(filePath: string, moduleOverview: ModuleOverview, modules?: string[]): string {
    return new languageGenerator(filePath, moduleOverview, modules).generateBedrock();
}

class languageGenerator {
    filePath: string;
    moduleOverview: ModuleOverview;
    modules?: string[];
    modFiles?: string[];
    log: string[] = [];

    constructor(filePath: string, moduleOverview: ModuleOverview, modules?: string[], modFiles?: string[]) {
        this.filePath = filePath;
        this.moduleOverview = moduleOverview;
        this.modules = modules;
        this.modFiles = modFiles;
    }

    _appendLog(entry: string): void {
        this.log.push(entry);
    }

    getContent(): Record<string, string> {
        let content: Record<string, string> = {};
        readFile(this.filePath, { flag: 'r', encoding: 'utf8' }, (err, data) => {
            if (err) {
                this._appendLog(err.message);
                return;
            }
            if (this.filePath.endsWith('.json')) {
                content = JSON.parse(data);
            }
            else if (this.filePath.endsWith('.lang')) {
                content = this.langToJSON(data);
            }
        });
        return content;
    }

    mergeModules(content: Record<string, string>): Record<string, string> {
        const modules = this.modules || [];
        const modulePath = this.moduleOverview.modulePath;
        for (const module of modules) {
            const addFile = `${modulePath}/${module}/add.json`;
            readFile(addFile, { encoding: 'utf8' }, (err, data) => {
                if (err) {
                    this._appendLog(err.message);
                    return;
                }
                const addContent = JSON.parse(data);
                for (const k in addContent) {
                    content[k] = addContent[k];
                }
            });
            const removeFile = `${modulePath}/${module}/remove.json`;
            readFile(removeFile, { encoding: 'utf8' }, (err, data) => {
                if (err) {
                    this._appendLog(err.message);
                    return;
                }
                const removeContent = JSON.parse(data);
                for (const k in removeContent) {
                    // TODO: check if this really works
                    delete content[removeContent[k]];
                }
            });
        }
        return content;
    }

    mergeMods(content: Record<string, string>): Record<string, string> {
        if (this.modFiles) {
            for (const mod of this.modFiles) {
                let modContent: Record<string, string> = {};
                readFile(`${mod}`, { encoding: 'utf8' }, (err, data) => {
                    if (err) {
                        this._appendLog(err.message);
                        return;
                    }
                    if (mod.endsWith('.lang')) {
                        modContent = this.langToJSON(data);
                    }
                    if (mod.endsWith('.json')) {
                        modContent = JSON.parse(data);
                    }
                });
                for (const k in modContent) {
                    content[k] = modContent[k];
                }
            }
        }
        return content;
    }

    generateJSON() {
        const content = this.getContent();
        return this.ensureAscii(JSON.stringify(this.mergeModules(content)));
    }

    generateJavaLegacy() {
        const content = this.getContent();
        return this.JSONToLang(this.mergeModules(content));
    }

    generateBedrock() {
        const content = this.getContent();
        return this.JSONToLang(this.mergeModules(content)).replace(/\n/g, '\t#\n');
    }

    langToJSON(content: string) {
        const result: Record<string, string> = {};
        content.replace(/\r\n/g, '\n').split('\n').forEach((value) => {
            if (value.trim() !== '' && !value.startsWith('#')) {
                const keyValuePair = value.split('=');
                result[keyValuePair[0].trim()] = keyValuePair[1].trim();
            }
        });
        return result;
    }

    JSONToLang(object: Record<string, string>) {
        const arr = [];
        for (const k in object) {
            arr.push(`${k}=${object[k]}\n`);
        }
        return arr.join('\n');
    }

    ensureAscii(str: string) {
        const arr: string[] = [];
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            arr[i] = code < 128 ? str[i] : `\\u${code.toString(16)}`;
        }
        return arr.join('');
    }
}