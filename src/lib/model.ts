import type { EntryFilter, FileEntry, FileOverride, FileOverrideMode, PersistedState, SavedProfile } from "./types";
export const DEFAULT_MAX_FILE_SIZE_BYTES=1_048_576;
export const DEFAULT_TOKEN_BUDGET=60_000;
export const WORKFLOW_PRESETS=[
 {id:"general",label:"General",description:"Balanced repository context",tokenBudget:60_000,include:[],exclude:["**/dist/**","**/coverage/**"]},
 {id:"chatgpt",label:"ChatGPT",description:"Focused coding context",tokenBudget:45_000,include:[],exclude:["**/*.lock","**/dist/**"]},
 {id:"claude",label:"Claude",description:"Broad code and docs context",tokenBudget:80_000,include:[],exclude:["**/dist/**"]},
 {id:"codex",label:"Codex",description:"Changed source and tests first",tokenBudget:50_000,include:[],exclude:["**/dist/**","**/coverage/**"]},
 {id:"gemini",label:"Gemini",description:"Repository exploration context",tokenBudget:70_000,include:[],exclude:["**/dist/**"]}
] as const;
export function parsePatterns(text:string):string[]{return [...new Set(text.split(/[\n,]/).map(v=>v.trim()).filter(Boolean))];}
export function formatPatterns(values:string[]):string{return values.join("\n");}
export function overrideFor(overrides:FileOverride[],path:string):FileOverrideMode{return overrides.find(v=>v.path===path)?.mode??"auto";}
export function setOverride(overrides:FileOverride[],path:string,mode:FileOverrideMode):FileOverride[]{const next=overrides.filter(v=>v.path!==path);if(mode!=="auto")next.push({path,mode});return next;}
export function toggleIncluded(overrides:FileOverride[],entry:FileEntry):FileOverride[]{return setOverride(overrides,entry.path,entry.included?"exclude":"include");}
export function togglePin(overrides:FileOverride[],entry:FileEntry):FileOverride[]{return setOverride(overrides,entry.path,overrideFor(overrides,entry.path)==="pin"?"auto":"pin");}
const SOURCE=new Set(["TypeScript","TSX","JavaScript","JSX","Svelte","Rust","Python","Go","Java","Kotlin","Swift","Ruby","PHP","C#","C","C++"]);
export function filterEntries(entries:FileEntry[],query:string,filter:EntryFilter):FileEntry[]{const q=query.trim().toLowerCase();return entries.filter(e=>{if(q&&!`${e.path} ${e.language}`.toLowerCase().includes(q))return false;switch(filter){case"included":return e.included;case"changed":return Boolean(e.gitStatus);case"source":return SOURCE.has(e.language);case"docs":return e.language==="Markdown"||e.path.toLowerCase().includes("readme")||e.path.startsWith("docs/");case"tests":return /(?:test|spec)/i.test(e.path);case"skipped":return !e.included;default:return true;}});}
export function formatBytes(bytes:number):string{if(bytes<1024)return `${bytes} B`;if(bytes<1024*1024)return `${(bytes/1024).toFixed(1)} KB`;return `${(bytes/(1024*1024)).toFixed(1)} MB`;}
export function formatTokenCount(tokens:number):string{return tokens>=1000?`${Math.round(tokens/100)/10}k`:`${tokens}`;}
export function budgetPercent(tokens:number,budget:number|null):number{return budget&&budget>0?Math.min(100,Math.round(tokens/budget*100)):0;}
export function addRecentProject(paths:string[],path:string):string[]{return [path,...paths.filter(v=>v!==path)].slice(0,10);}
export function upsertProfile(profiles:SavedProfile[],profile:SavedProfile):SavedProfile[]{return [profile,...profiles.filter(v=>v.id!==profile.id)];}
export function normalizeError(error:unknown):string{return error instanceof Error?error.message:typeof error==="string"?error:"Unexpected error";}
export function shortcutAction(event:{metaKey?:boolean;ctrlKey?:boolean;key:string}):"generate"|"choose"|"rules"|"search"|null{if(!(event.metaKey||event.ctrlKey))return null;switch(event.key.toLowerCase()){case"g":return"generate";case"o":return"choose";case",":return"rules";case"f":return"search";default:return null;}}
export function defaultPersistedState():PersistedState{return{recentProjects:[],profiles:[],settings:{appearance:"system",liveRefresh:false,selectedPreset:"general"},lastExportPath:null};}
