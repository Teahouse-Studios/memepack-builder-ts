import { ModuleInfo } from './ModuleInfo';

export interface ModuleOverview {
    modulePath: string;
    modules: {
        collection: Record<string, ModuleInfo>;
        resource: Record<string, ModuleInfo>;
    }
}