import { runAgent } from "../agent/agent";


const main = async()=>{
    const input = process.argv.slice(2).join(" ").trim()
    try {
        await runAgent(input);
    } catch (error) {
        console.log('error in main function')
        process.exit(1);
    }
}

main();