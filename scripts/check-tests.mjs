import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
const roots=["src","crates","src-tauri"];
const bad=[/\b(?:describe|it|test)\.(?:skip|only|todo)\s*\(/, /\b(?:xdescribe|xit|xtest)\s*\(/, /#\s*\[\s*ignore\s*\]/];
async function walk(dir){let out=[];for(const e of await readdir(dir,{withFileTypes:true}).catch(()=>[])){const p=join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else if([".ts",".js",".svelte",".rs"].includes(extname(p)))out.push(p);}return out;}
const failures=[];for(const r of roots)for(const f of await walk(r)){const text=await readFile(f,"utf8");for(const pattern of bad)if(pattern.test(text))failures.push(`${f}: ${pattern}`);}
if(failures.length){console.error(`Disabled/focused tests found:\n${failures.join("\n")}`);process.exit(1);}console.log("No skipped, focused, todo, or ignored required tests found.");
