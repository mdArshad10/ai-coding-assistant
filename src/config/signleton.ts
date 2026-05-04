import type { SettingManages } from "./setting";

let globalSetting : SettingManages | null = null;

export const getGlobalSetting = (): SettingManages | null=> {
    return globalSetting;
};