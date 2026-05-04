import dotenv from 'dotenv'
import path from 'node:path'
import { ChatOpenAI } from "@langchain/openai";
dotenv.config({path: path.join(process.cwd(),".env")})


export const runAgent = async (input:string)=>{

    const apiKey = process.env.OPENROUTER_API_KEY;
    const modelName = process.env.MODEL_NAME;
    const baseURL = process.env.OPENROUTER_BASE_URL;
    const appUrl = process.env.APP_URL;

    if(!apiKey || !modelName || !baseURL){
        throw new Error("Env variables required")
    }

    const llm = new ChatOpenAI({
      model: modelName,
      temperature: 0.7,
      apiKey,
      maxTokens:4069,
      configuration:{
        baseURL,
        defaultHeaders:{
            Authorization:`Bearer ${apiKey}`,
            "HTTP-Referer":appUrl,
            "X-Title":"AI Coding Agent"
        }
      }
    });

    try {
       const response =  await llm.invoke([
            {
                role:"system",
                content:"You as a senior software Engineer assistance. Prioritize safety and minimal code change."
            },
            {
                role:"human",
                content:input
            }
        ])
        return String(response.content)
    } catch (error) {
        console.log("")
        throw new Error("Failed to get response from llm")
    }

}