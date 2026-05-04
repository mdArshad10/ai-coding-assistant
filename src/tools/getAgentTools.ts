import { StructuredTool } from "@langchain/core/tools"
import {z} from 'zod'
import { guardedWriteFile, safeReadFile } from "../safety";


//first tool: Reading a file from the file system
export class ReadFileTool extends StructuredTool{
    name="read_file";
    description: string="Reads the content of a file from the file system";
    schema=z.object({
        path:z.string().describe("The path of the file to be read"),
        content:z.string().describe("Content to write to the file")
    })

    async _call({path,content}:{path:string,content:string}) {
        const result = await guardedWriteFile(path,content);
        if(!result?.success){
            return new Error(`Error reading file: ${result?.error}`);
        }

        return result?.content || "";
    }
}

// second tool: writing a file in file system
export class WriteFileTool extends StructuredTool {
  name = "write_file";
  description: string = "write the content on a file in file system";
  schema = z.object({
    path: z.string().describe("The path of the file to be read"),
  });

  async _call({ path }: { path: string }) {
    const result = await safeReadFile(path);
    if (!result?.success) {
      return new Error(`Error reading file: ${result.error}`);
    }

    return result?.content || "";
  }
}


export const getAgentTool = ()=>{

    return [
        new ReadFileTool(),
        new WriteFileTool(),
    ]
}