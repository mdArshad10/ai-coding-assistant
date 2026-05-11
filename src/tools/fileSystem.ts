import path from 'node:path'
import fs from 'node:fs'


interface FileReadResult{
    success:boolean,
    content?:string,
    error?:string,
    path?:string
}

interface FileWriteResult{
    success:boolean,
    error?:string,
    path?:string
}

export const readFile = async(filePath:string)=>{
    try {
        const resolvedPath = path.resolve(process.cwd(),filePath);
        if(!resolvedPath.startsWith(process.cwd())){
            return {
                success:false,
                error:"Access denied: Attempt to read file outside the project directory",
                path:filePath
            }
        }
        const content = await fs.promises.readFile(resolvedPath,'utf-8');
        return{
            success:true,
            content,
            path:filePath
        }
    } catch (error) {
        return {
            success:false,
            error:`Error reading file:`,
            path:filePath
        }
    }
}

export const writeFile = async(filePath:string,content:string) =>{
    try {
        const resolvedPath = path.resolve(process.cwd(),filePath);
        if (!resolvedPath.startsWith(process.cwd())) {
          return {
            success: false,
            error:
              "Access denied: Attempt to write file outside the project directory",
            path: filePath,
          };
        }
        await fs.promises.mkdir(path.dirname(resolvedPath), {recursive:true});
        await fs.promises.writeFile(resolvedPath,content, "utf-8");
        return {
          success: true,
          path: filePath,
        };
    } catch (error) {
        return {
          success: false,
          error: `Error writing file:`,
          path: filePath,
        };
    }
}