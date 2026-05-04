interface AllowListRule{
    path?:string;
    command?:string;
    operation?:"read" | "delete" |"execute";
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

export class SettingManages{
    private settings:Settings;
    constructor(projectRoot?:string){
        const root = projectRoot || process.cwd();
        this.settings = {...DEFAULT_SETTINGS}

    }

    getSettings():Settings{
        return this.settings
    }
}