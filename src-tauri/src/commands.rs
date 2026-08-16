use crate::{path_guard, state::{self, PersistedState}, watcher::{self, WatcherState}};
use git_ingest_core::{self, GenerateRequest, GenerationResult, InspectRequest, InspectionResult};
use std::{fs, path::{Path, PathBuf}};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_opener::OpenerExt;

fn state_path(app:&AppHandle)->Result<PathBuf,String>{app.path().app_config_dir().map(|p|p.join("state.json")).map_err(|e|e.to_string())}

#[tauri::command] pub fn inspect_project(request:InspectRequest)->Result<InspectionResult,String>{git_ingest_core::inspect(&request).map_err(|e|e.to_string())}
#[tauri::command] pub fn preview_file(root_path:String,relative_path:String)->Result<String,String>{let root=git_ingest_core::validate_root(&root_path).map_err(|e|e.to_string())?;let safe=path_guard::safe_relative_path(&root,&relative_path)?;let rel=safe.strip_prefix(&root).map_err(|e|e.to_string())?.to_string_lossy().to_string();git_ingest_core::read_project_file(&root_path,&rel,524_288).map_err(|e|e.to_string())}
#[tauri::command] pub fn git_diff(root_path:String,relative_path:String)->Result<String,String>{let root=git_ingest_core::validate_root(&root_path).map_err(|e|e.to_string())?;path_guard::safe_relative_path(&root,&relative_path)?;Ok(git_ingest_core::read_git_diff(&root,&relative_path).unwrap_or_default())}
#[tauri::command] pub fn generate_context(request:GenerateRequest)->Result<GenerationResult,String>{git_ingest_core::generate(&request).map_err(|e|e.to_string())}
#[tauri::command] pub fn load_app_state(app:AppHandle)->Result<PersistedState,String>{state::load(&state_path(&app)?)}
#[tauri::command] pub fn save_app_state(app:AppHandle,value:PersistedState)->Result<(),String>{state::save(&state_path(&app)?,&value)}
#[tauri::command] pub fn write_output(path:String,contents:String)->Result<String,String>{let target=path_guard::writable_export_path(Path::new(&path))?;fs::write(&target,contents).map_err(|e|e.to_string())?;Ok(target.display().to_string())}
fn safe_existing_output(path:&str)->Result<PathBuf,String>{let p=Path::new(path);let ext=p.extension().and_then(|v|v.to_str()).unwrap_or_default().to_ascii_lowercase();if !matches!(ext.as_str(),"md"|"txt"){return Err("only Git-Ingest text exports can be opened".into());}let c=fs::canonicalize(p).map_err(|e|e.to_string())?;if !c.is_file(){return Err("output is not a file".into());}Ok(c)}
#[tauri::command] pub fn open_output(app:AppHandle,path:String)->Result<(),String>{let p=safe_existing_output(&path)?;app.opener().open_path(p,None::<&str>).map_err(|e|e.to_string())}
#[tauri::command] pub fn reveal_output(app:AppHandle,path:String)->Result<(),String>{let p=safe_existing_output(&path)?;app.opener().reveal_item_in_dir(p).map_err(|e|e.to_string())}
#[tauri::command] pub fn start_watch(app:AppHandle,state:State<'_,WatcherState>,root_path:String)->Result<(),String>{let root=git_ingest_core::validate_root(&root_path).map_err(|e|e.to_string())?;watcher::start(app,&state,&root)}
#[tauri::command] pub fn stop_watch(state:State<'_,WatcherState>)->Result<(),String>{watcher::stop(&state)}
