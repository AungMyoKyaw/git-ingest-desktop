use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use std::{path::Path, sync::Mutex};
use tauri::{AppHandle, Emitter};

#[derive(Default)] pub struct WatcherState(pub Mutex<Option<RecommendedWatcher>>);

pub fn stop(state:&WatcherState)->Result<(),String>{*state.0.lock().map_err(|_|"watcher lock poisoned".to_string())?=None;Ok(())}
pub fn start(app:AppHandle,state:&WatcherState,root:&Path)->Result<(),String>{stop(state)?;let mut watcher=notify::recommended_watcher(move|event:Result<notify::Event,notify::Error>|{if let Ok(event)=event{let paths:Vec<String>=event.paths.into_iter().map(|p|p.display().to_string()).collect();let _=app.emit("project-changed",paths);}}).map_err(|e|e.to_string())?;watcher.watch(root,RecursiveMode::Recursive).map_err(|e|e.to_string())?;*state.0.lock().map_err(|_|"watcher lock poisoned".to_string())?=Some(watcher);Ok(())}
