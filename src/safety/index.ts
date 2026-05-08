
import path from 'node:path'
import fs from 'node:fs'
import { success } from 'zod';
import { readFile } from '../tools/fileSystem';
import { getGlobalSetting } from '../config/signleton';
import { Select } from "enquirer";

interface SafetyContext {
    projectRoot:string;
    allowedPaths:string[];
    blockedPaths:RegExp[];
    requiresConfirmation:boolean;
}

const DEFAULT_CONTEXT:SafetyContext ={
    projectRoot:process.cwd(),
    allowedPaths: [process.cwd()],
    blockedPaths:[/node_modules/,/\.env/,/\.git/,/dist/],
    requiresConfirmation:true
}

const validateFileOperation=async (operation:'read'|'write'|'delete',filePath:string,
    context:SafetyContext = DEFAULT_CONTEXT
)=>{
    if(!isPathAllowed(filePath,context)){
        return {
            success:false,
            reason:`Operation ${operation} on path ${filePath} is not allowed due to safety restriction`
        }
    }

    if(operation == 'delete'){
        const exitResult = await fileExists(filePath)
        if(!exitResult.exists){
            return {
                safe:false,
                reason:`File ${filePath} doesn't exist and cannot be deleted.`
            }
        }

        const criticalFiles = [
            "package.json",
            ".gitignore",
            "package-lock.json",
            "dist",
            'yarn.lock',
            'bun.lock',
            'tsconfig.json',
            "README.md",
            "AI_CODING_AGENT.md"
        ]

        if(criticalFiles.includes((path.basename(filePath)))){
            return {
                safe:false,
                reason:`File ${filePath} is considered critical and cannot be deleted.`
            }
        }

    }

    if(operation =="write"){
        const ext = path.extname(filePath).toLowerCase();
        const binaryExtension = [".exe",".ddl",".bat",".sh",".bin",".o",".so"]
        if(binaryExtension.includes(ext)){
            return {
                safe:false,
                reason:`writing to files with extension ${ext} is not allowed for safety reasons.`
            }
        }

    }
    return {safe: true}
}

const requiredConfirmation = async (
  operation: "execute" | "write" | "delete",
  target: string,
  details?: string,
) => {
  const settings = getGlobalSetting();
  if(settings){
    if(operation =="execute"){
        if(settings.isCommandAllowed(target)){
            return {approval:true}
        }
    }else{
        if(settings.isFileAllowed(target,operation)){
            return { approval: true };
        }
    }
  }

  const isInteractive = process.stdin.isTTY;
  if(isInteractive){
    const settingsObj = settings?.getSettings();
    const autoConfirm = settingsObj?.preferences.autoConfirmNonInteractive || false;

    const allowed = operation ==="execute" ? settings?.isCommandAllowed(target) :settings?.isFileAllowed(target,operation) ;

    if(autoConfirm || allowed){
        if(allowed){
            console.log(`Auto-approving ${operation} operation on ${target} based on allowedList settings`);
        }else{
            console.log(`Auto-approving ${operation} operation on ${target} in  non-interactive mode`);
            
        }
        return {approved:true}
    }

    return { approved: false };
  } 

  const settingsObj = settings?.getSettings();
  const confirmationMode = settingsObj?.preferences.confirmationMode ?? "manual";
  if(confirmationMode =="auto"){
    console.log(`Auto approving ${operation} on target ${target} based on settings.`);
  }

  const targetType= operation =="execute" ?"command":"file";
  const yesChoice = "1) Yes";
  const yesRememberChoice = `2) Yes, and remember this choice for the ${targetType}`;
  const noChoice = `3) No`;

  const prompt = new Select({
    name: "confirm",
    message: `Allow ${operation} on ${target}`,
    choices: [yesChoice, yesRememberChoice, noChoice],
  });

    if(details){
            // display the detail in terminal
    }

    try {
        const answer = await prompt.run();
        if(answer == yesChoice){
            return {approved:true}
        }else if(answer == yesRememberChoice){
            if(settings){
                await settings.addCommandToAllowedList(target);
            }
        }
    } catch (error) {
        
    }
};

const fileExists = async(filePath:string)=>{
    try {
        const resolvedPath = path.resolve(process.cwd(),filePath);
        await fs.promises.readFile(resolvedPath)
        return {
            exists:true,
            path:filePath
        }
    } catch (error) {
        return {
          exists: false,
          path: filePath,
        };
    }
}


const isPathAllowed = (filePath:string, context:SafetyContext)=>{
    try {
        const resolvedPath = path.resolve(context.projectRoot,filePath);
    
        if(!resolvedPath.startsWith(context.projectRoot)){
            return false
        }
    
        const relativePath = path.relative(context.projectRoot,resolvedPath);

        if(relativePath && context.blockedPaths.some((pattern)=>pattern.test(relativePath))){
            return false;
        }

        return context.allowedPaths.some((allowed)=>resolvedPath.startsWith(path.resolve(context.projectRoot,allowed)))

    } catch (error) {
        return false
    }

}

export const safeReadFile = async (filePath: string) => {
  try {
    const validate = await validateFileOperation("read", filePath);
    if (!validate.safe) {
      return {
        success: false,
        error: validate.reason,
        path: filePath,
      };
    }
    return readFile(filePath)
  } catch (error) {
    return {
        success:false,
        error:'the file is not safe'
    }
  }
};

export const guardedWriteFile = async (
  filePath: string,
  content: string,
  requiresConfirmation:boolean=false,
) => {
    const validate = await validateFileOperation('write',filePath);
    if(!validate.safe){
        return {
          success: false,
          error: validate.reason,
          path: filePath,
        };
    }

    let needConfirmation = requiresConfirmation;
    if(needConfirmation == undefined){
        const settings = getGlobalSetting();
        const settingsObj = settings?.getSettings();
        const mode = settingsObj?.preferences.confirmationMode || "manual";
        needConfirmation = mode ==="manual";
    }

    if(needConfirmation){
        await requiredConfirmation("write",filePath, `${content.length} bytes`)
    }
};