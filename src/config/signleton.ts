import type { SettingManages } from "./setting";

let globalSetting : SettingManages | null = null;

export const getGlobalSetting = (): SettingManages | null=> {
    return globalSetting;
};

export const isCommandAllowed = (command: string) => {

    return globalSetting?.isCommandAllowed(command) || false;
};

export const isFileAllowed= (filepath:string,operation: "write" | "delete")=>{
    return globalSetting?.isFileAllowed(filepath, operation) ?? false;
}