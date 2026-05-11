import path from 'node:path'
import fsp from 'node:fs/promises'

interface AllowListRule{
    path?:string;
    command?:string;
    operation?:"read" | "delete" |"execute"|"write";
    addedAt:number
}

export interface Settings{
    version:string;
    allowList:{
        files: AllowListRule[],
        commands:AllowListRule[],
    },
    preferences:{
        confirmationMode:"manual"|"auto";
        autoConfirmNonInteractive:boolean;
    }
}

const DEFAULT_SETTINGS:Settings = {
    version:"1.0.0",
    allowList:{
        files:[],
        commands:[]
    },
    preferences:{
        confirmationMode:"manual",
        autoConfirmNonInteractive:true
    }
}

export class SettingManages {
  private settings: Settings;
  private dirty: boolean = false;
  private settingsPath: string;

  constructor(projectRoot?: string) {
    const root = projectRoot || process.cwd();
    this.settings = { ...DEFAULT_SETTINGS };
    this.settingsPath = path.resolve(
      root,
      "aicodingagent",
      "settings.local.json",
    );
  }

  getSettings(): Settings {
    return this.settings;
  }

  isCommandAllowed(command: string) {
    const rules = this.settings.allowList.commands;
    return rules.some((rule: AllowListRule) => {
      if (!rule.command) return false;
      return command.startsWith(rule.command) || command.includes(rule.command);
    });
  }

  isFileAllowed(filepath: string, operation: "write" | "delete") {
    const rules = this.settings?.allowList.files;
    return rules.some((rule: AllowListRule) => {
      if (
        rule.path === filepath &&
        (rule.operation == operation || rule.operation == "write")
      ) {
        return true;
      }
      return false;
    });
  }

  async addCommandToAllowedList(command: string) {
    const exits = this.settings.allowList.commands.some(
      (rule: AllowListRule) => rule.command === command,
    );
    if (exits) {
      return;
    }

    this.settings.allowList.commands.push({
      command,
      addedAt: Date.now(),
    });

    this.dirty = true;
    await this.save();
  }

  async addFileToAllowedList(filepath: string, operation: "write" | "delete") {
    const exists = this.settings.allowList.files.some((r)=>r.path && r.operation== operation)
    if(exists) return;
    this.settings.allowList.files.push({
      path:filepath,
      operation,
      addedAt:Date.now()
    })
    this.dirty=true;
    await this.save();
  }

  async save() {
    if (!this.dirty) return;
    try {
      await this.ensureDirectory();
      const tempPath = `${this.settingsPath}.tmp`;
      const data = JSON.stringify(this.settings, null, 2);

      await fsp.writeFile(tempPath, data, "utf-8");
      await fsp.rename(tempPath, this.settingsPath);
      this.dirty = false;
    } catch (error) {
      console.log(`Error to save setting`);
    }
  }

  async ensureDirectory() {
    try {
      const dir = path.dirname(this.settingsPath);
    } catch (error) {}
  }
}