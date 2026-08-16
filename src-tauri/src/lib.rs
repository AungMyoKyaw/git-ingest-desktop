mod commands;
mod path_guard;
mod state;
mod watcher;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .manage(watcher::WatcherState::default())
        .invoke_handler(tauri::generate_handler![
            commands::inspect_project,
            commands::preview_file,
            commands::git_diff,
            commands::generate_context,
            commands::load_app_state,
            commands::save_app_state,
            commands::write_output,
            commands::open_output,
            commands::reveal_output,
            commands::start_watch,
            commands::stop_watch
        ])
        .run(tauri::generate_context!())
        .expect("error while running Git-Ingest");
}
