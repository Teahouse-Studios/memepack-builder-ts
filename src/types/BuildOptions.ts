import { SelectedModules } from "./SelectedModules";

export interface BuildOptions extends Object {
    platform: string;
    type: string;
    output: string;
    modules: SelectedModules;
    mod?: string[];
    format?: number;
    sfw?: boolean;
    compatible?: boolean;
    hash?: boolean;
}