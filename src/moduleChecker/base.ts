import { readdir, readFile, stat } from "node:fs";
import { ModuleOverview } from "../types";

export class moduleChecker {
    modulePath: string;
    log: string[] = [];
    moduleInfo: () => ModuleOverview;

    constructor(modulePath: string) {
        this.modulePath = modulePath;
        this.moduleInfo = this.validateModules;
    }

    _appendLog(entry: string): void {
        this.log.push(entry);
    }

    validateModules(): ModuleOverview {
        const overview: ModuleOverview = {
            modulePath: this.modulePath,
            modules: {
                collection: [],
                resource: []
            }
        };
        readdir(this.modulePath, (err, files) => {
            if (err) {
                this._appendLog(err.message);
                return;
            }
            for (const file of files) {
                readFile(`${this.modulePath}/${file}/module_manifest.json`, { encoding: 'utf8' }, (err, data) => {
                    if (err) {
                        this._appendLog(err.message);
                        return;
                    }
                    const parsedData = JSON.parse(data);
                    const moduleType: string = parsedData.type;
                    delete parsedData['type'];
                    switch (moduleType) {
                        case 'collection':
                            overview.modules.collection.push(parsedData);
                            break;
                        case 'resource':
                            overview.modules.resource.push(parsedData);
                            break;
                        default:
                            break;
                    }
                });
            }
        });
        return overview;
    }
}