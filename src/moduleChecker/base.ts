import * as fs from "fs";
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
        for (const file of fs.readdirSync(this.modulePath)) {
            const parsedData = require(`${this.modulePath}/${file}/module_manifest.json`);
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
        }
        return overview;
    }
}