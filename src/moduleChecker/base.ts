import { stat } from "node:fs";
import { ModuleOverview } from "../types";

export class moduleChecker {
    modulePath: string;
    log: string[] = [];
    moduleInfo: () => ModuleOverview;

    constructor(modulePath: string) {
        this.modulePath = modulePath;
        this.moduleInfo = this.validateModules;
    }

    validateModules(): ModuleOverview {
        const overview = {
            modulePath: this.modulePath,
            modules: {
                collection: {},
                resource: {}
            }
        };

        return overview;
    }

    _flattenCollection() {
        ;
    }

    _existResourceDirs(moduleName: string): boolean {
        const resDirs = ['assets', 'sounds', 'credits', 'models', 'textures'];
        for (const dir of resDirs) {
            stat(`${this.modulePath}/${moduleName}/${dir}`, (_, stats) => {
                if (stats.isDirectory()) {
                    return true;
                }
            });
        }
        return false;
    }

    _existLangFiles(moduleName: string): boolean {
        const langFiles = ['add.json', 'remove.json'];
        for (const file of langFiles) {
            stat(`${this.modulePath}/${moduleName}/${file}`, (_, stats) => {
                if (stats.isFile()) {
                    return true;
                }
            });
        }
        return false;
    }
}