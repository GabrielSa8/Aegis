use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::RwLock;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

use crate::config::{get_aegis_config, save_aegis_config};
use crate::db::get_db_paths;

pub struct VaultState {
    pub is_locked: RwLock<bool>,
    pub master_key: RwLock<Option<[u8; 32]>>,
    pub last_activity_timestamp: RwLock<u64>,
}

impl VaultState {
    pub fn new(is_master_password_enabled: bool) -> Self {
        Self {
            is_locked: RwLock::new(is_master_password_enabled),
            master_key: RwLock::new(None),
            last_activity_timestamp: RwLock::new(current_timestamp()),
        }
    }
}

fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecurityStatus {
    pub master_password_enabled: bool,
    pub is_locked: bool,
    pub encrypt_credentials: bool,
    pub encrypt_database: bool,
    pub auto_lock_minutes: u32,
    pub lock_on_tray_minimize: bool,
    pub has_encrypted_db: bool,
}

pub fn derive_master_key(password: &str, salt: &[u8]) -> Result<[u8; 32], String> {
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(password.as_bytes(), salt, &mut key)
        .map_err(|e| format!("Error en derivación de clave Argon2id: {}", e))?;
    Ok(key)
}

pub fn hash_master_password(password: &str) -> Result<(String, String), String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| format!("Error generando hash: {}", e))?
        .to_string();

    let mut raw_salt = [0u8; 16];
    OsRng.fill_bytes(&mut raw_salt);
    let salt_hex = hex::encode(raw_salt);

    Ok((hash, salt_hex))
}

pub fn verify_master_password(password: &str, hash_str: &str) -> bool {
    if let Ok(parsed_hash) = PasswordHash::new(hash_str) {
        Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok()
    } else {
        false
    }
}

pub fn encrypt_bytes(key: &[u8; 32], plaintext: &[u8]) -> Result<Vec<u8>, String> {
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| format!("Error inicializando cifrador AES-256-GCM: {}", e))?;

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| format!("Error cifrando datos AES-256-GCM: {}", e))?;

    let mut result = Vec::with_capacity(12 + ciphertext.len());
    result.extend_from_slice(&nonce_bytes);
    result.extend_from_slice(&ciphertext);
    Ok(result)
}

pub fn decrypt_bytes(key: &[u8; 32], payload: &[u8]) -> Result<Vec<u8>, String> {
    if payload.len() < 12 {
        return Err("Payload cifrado inválido: longitud insuficiente".to_string());
    }

    let (nonce_bytes, ciphertext) = payload.split_at(12);
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| format!("Error inicializando descifrador AES-256-GCM: {}", e))?;
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Error descifrando payload (clave o datos corruptos): {}", e))?;

    Ok(plaintext)
}

pub fn encrypt_string(key: &[u8; 32], text: &str) -> Result<String, String> {
    let encrypted = encrypt_bytes(key, text.as_bytes())?;
    Ok(hex::encode(encrypted))
}

pub fn decrypt_string(key: &[u8; 32], hex_text: &str) -> Result<String, String> {
    let payload = hex::decode(hex_text).map_err(|e| format!("Hex inválido: {}", e))?;
    let decrypted = decrypt_bytes(key, &payload)?;
    String::from_utf8(decrypted).map_err(|e| format!("Texto UTF-8 corrupto: {}", e))
}

pub fn get_encrypted_db_path() -> PathBuf {
    let (_, db_path) = get_db_paths();
    let parent = db_path.parent().unwrap_or_else(|| std::path::Path::new("."));
    parent.join("aegis_lifeos.db.enc")
}

pub fn encrypt_database_file(key: &[u8; 32]) -> Result<(), String> {
    let (_, db_path) = get_db_paths();
    if !db_path.exists() {
        return Ok(());
    }

    let plaintext_bytes = fs::read(&db_path)
        .map_err(|e| format!("Error leyendo base SQLite para cifrado: {}", e))?;

    let encrypted_bytes = encrypt_bytes(key, &plaintext_bytes)?;
    let enc_path = get_encrypted_db_path();

    fs::write(&enc_path, encrypted_bytes)
        .map_err(|e| format!("Error escribiendo base cifrada {}: {}", enc_path.display(), e))?;

    // Sobrescritura segura con ceros antes de unlinking
    let len = plaintext_bytes.len();
    let zero_bytes = vec![0u8; len];
    let _ = fs::write(&db_path, zero_bytes);
    let _ = fs::remove_file(&db_path);

    let wal_path = db_path.with_extension("db-wal");
    if wal_path.exists() {
        let _ = fs::remove_file(wal_path);
    }
    let shm_path = db_path.with_extension("db-shm");
    if shm_path.exists() {
        let _ = fs::remove_file(shm_path);
    }

    Ok(())
}

pub fn decrypt_database_file(key: &[u8; 32]) -> Result<(), String> {
    let enc_path = get_encrypted_db_path();
    if !enc_path.exists() {
        return Ok(());
    }

    let enc_bytes = fs::read(&enc_path)
        .map_err(|e| format!("Error leyendo base cifrada {}: {}", enc_path.display(), e))?;

    let plaintext_bytes = decrypt_bytes(key, &enc_bytes)?;
    let (_, db_path) = get_db_paths();

    fs::write(&db_path, plaintext_bytes)
        .map_err(|e| format!("Error restaurando base SQLite {}: {}", db_path.display(), e))?;

    let _ = fs::remove_file(&enc_path);
    Ok(())
}

// ==========================================
// Comandos Tauri IPC
// ==========================================

#[tauri::command]
pub fn get_security_status(state: State<VaultState>) -> Result<SecurityStatus, String> {
    let config = get_aegis_config()?;
    let is_locked = *state.is_locked.read().map_err(|e| e.to_string())?;

    Ok(SecurityStatus {
        master_password_enabled: config.security.master_password_enabled,
        is_locked,
        encrypt_credentials: config.security.encrypt_credentials,
        encrypt_database: config.security.encrypt_database,
        auto_lock_minutes: config.security.auto_lock_minutes,
        lock_on_tray_minimize: config.security.lock_on_tray_minimize,
        has_encrypted_db: get_encrypted_db_path().exists(),
    })
}

#[tauri::command]
pub fn setup_master_password(
    password: String,
    confirm_password: String,
    encrypt_credentials: bool,
    encrypt_database: bool,
    auto_lock_minutes: u32,
    lock_on_tray_minimize: bool,
    state: State<VaultState>,
) -> Result<SecurityStatus, String> {
    if password.len() < 6 {
        return Err("La contraseña maestra debe tener al menos 6 caracteres".to_string());
    }
    if password != confirm_password {
        return Err("Las contraseñas no coinciden".to_string());
    }

    let (hash, salt_hex) = hash_master_password(&password)?;
    let salt_bytes = hex::decode(&salt_hex).map_err(|e| format!("Error decodificando salt: {}", e))?;
    let key = derive_master_key(&password, &salt_bytes)?;

    let mut config = get_aegis_config()?;
    config.security.master_password_enabled = true;
    config.security.password_hash = hash;
    config.security.salt_hex = salt_hex;
    config.security.encrypt_credentials = encrypt_credentials;
    config.security.encrypt_database = encrypt_database;
    config.security.auto_lock_minutes = auto_lock_minutes;
    config.security.lock_on_tray_minimize = lock_on_tray_minimize;

    save_aegis_config(config)?;

    *state.master_key.write().map_err(|e| e.to_string())? = Some(key);
    *state.is_locked.write().map_err(|e| e.to_string())? = false;
    *state.last_activity_timestamp.write().map_err(|e| e.to_string())? = current_timestamp();

    get_security_status(state)
}

#[tauri::command]
pub fn unlock_vault(password: String, state: State<VaultState>) -> Result<SecurityStatus, String> {
    let config = get_aegis_config()?;
    if !config.security.master_password_enabled {
        *state.is_locked.write().map_err(|e| e.to_string())? = false;
        return get_security_status(state);
    }

    if !verify_master_password(&password, &config.security.password_hash) {
        return Err("Contraseña maestra incorrecta".to_string());
    }

    let salt_bytes = hex::decode(&config.security.salt_hex)
        .map_err(|e| format!("Error en salt almacenado: {}", e))?;
    let key = derive_master_key(&password, &salt_bytes)?;

    // Si la base de datos estaba cifrada en reposo, restaurarla a claro para uso activo
    if get_encrypted_db_path().exists() {
        decrypt_database_file(&key)?;
    }

    *state.master_key.write().map_err(|e| e.to_string())? = Some(key);
    *state.is_locked.write().map_err(|e| e.to_string())? = false;
    *state.last_activity_timestamp.write().map_err(|e| e.to_string())? = current_timestamp();

    get_security_status(state)
}

#[tauri::command]
pub fn lock_vault(state: State<VaultState>) -> Result<SecurityStatus, String> {
    let config = get_aegis_config()?;
    if !config.security.master_password_enabled {
        return get_security_status(state);
    }

    // Si el cifrado de base de datos está activo, cifrar en reposo antes de descartar la clave
    if config.security.encrypt_database {
        if let Some(key) = *state.master_key.read().map_err(|e| e.to_string())? {
            encrypt_database_file(&key)?;
        }
    }

    // Zeroize y purga de clave maestra en memoria
    *state.master_key.write().map_err(|e| e.to_string())? = None;
    *state.is_locked.write().map_err(|e| e.to_string())? = true;

    get_security_status(state)
}

#[tauri::command]
pub fn change_master_password(
    current_password: String,
    new_password: String,
    confirm_password: String,
    state: State<VaultState>,
) -> Result<SecurityStatus, String> {
    let mut config = get_aegis_config()?;
    if !config.security.master_password_enabled {
        return Err("La contraseña maestra no está configurada".to_string());
    }

    if !verify_master_password(&current_password, &config.security.password_hash) {
        return Err("La contraseña actual es incorrecta".to_string());
    }

    if new_password.len() < 6 {
        return Err("La nueva contraseña debe tener al menos 6 caracteres".to_string());
    }
    if new_password != confirm_password {
        return Err("Las contraseñas no coinciden".to_string());
    }

    let (new_hash, new_salt_hex) = hash_master_password(&new_password)?;
    let new_salt_bytes = hex::decode(&new_salt_hex).map_err(|e| format!("Error en salt: {}", e))?;
    let new_key = derive_master_key(&new_password, &new_salt_bytes)?;

    // Si la base estaba cifrada en disco, re-cifrar con la nueva clave si estaba cerrada
    let old_salt_bytes = hex::decode(&config.security.salt_hex).map_err(|e| format!("Error salt viejo: {}", e))?;
    let old_key = derive_master_key(&current_password, &old_salt_bytes)?;

    if get_encrypted_db_path().exists() {
        decrypt_database_file(&old_key)?;
        encrypt_database_file(&new_key)?;
    }

    config.security.password_hash = new_hash;
    config.security.salt_hex = new_salt_hex;
    save_aegis_config(config)?;

    *state.master_key.write().map_err(|e| e.to_string())? = Some(new_key);
    *state.is_locked.write().map_err(|e| e.to_string())? = false;

    get_security_status(state)
}

#[tauri::command]
pub fn disable_master_password(
    current_password: String,
    state: State<VaultState>,
) -> Result<SecurityStatus, String> {
    let mut config = get_aegis_config()?;
    if !config.security.master_password_enabled {
        return get_security_status(state);
    }

    if !verify_master_password(&current_password, &config.security.password_hash) {
        return Err("Contraseña actual incorrecta".to_string());
    }

    let salt_bytes = hex::decode(&config.security.salt_hex).map_err(|e| format!("Error en salt: {}", e))?;
    let key = derive_master_key(&current_password, &salt_bytes)?;

    if get_encrypted_db_path().exists() {
        decrypt_database_file(&key)?;
    }

    config.security.master_password_enabled = false;
    config.security.password_hash = String::new();
    config.security.salt_hex = String::new();
    config.security.encrypt_database = false;
    save_aegis_config(config)?;

    *state.master_key.write().map_err(|e| e.to_string())? = None;
    *state.is_locked.write().map_err(|e| e.to_string())? = false;

    get_security_status(state)
}

#[tauri::command]
pub fn update_security_policies(
    encrypt_credentials: bool,
    encrypt_database: bool,
    auto_lock_minutes: u32,
    lock_on_tray_minimize: bool,
    state: State<VaultState>,
) -> Result<SecurityStatus, String> {
    let mut config = get_aegis_config()?;
    config.security.encrypt_credentials = encrypt_credentials;
    config.security.encrypt_database = encrypt_database;
    config.security.auto_lock_minutes = auto_lock_minutes;
    config.security.lock_on_tray_minimize = lock_on_tray_minimize;
    save_aegis_config(config)?;

    get_security_status(state)
}

#[tauri::command]
pub fn record_vault_activity(state: State<VaultState>) -> Result<bool, String> {
    let config = get_aegis_config()?;
    let now = current_timestamp();

    if config.security.master_password_enabled
        && config.security.auto_lock_minutes > 0
        && !*state.is_locked.read().map_err(|e| e.to_string())?
    {
        let last = *state.last_activity_timestamp.read().map_err(|e| e.to_string())?;
        let timeout_secs = (config.security.auto_lock_minutes as u64) * 60;
        if now.saturating_sub(last) >= timeout_secs {
            let _ = lock_vault(state);
            return Ok(true); // Locked due to inactivity
        }
    }

    *state.last_activity_timestamp.write().map_err(|e| e.to_string())? = now;
    Ok(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hashing_and_verification() {
        let password = "SuperSecretMasterKey2026!";
        let (hash, salt_hex) = hash_master_password(password).expect("hash failed");
        assert!(verify_master_password(password, &hash));
        assert!(!verify_master_password("WrongPassword!", &hash));
        assert_eq!(salt_hex.len(), 32);
    }

    #[test]
    fn test_aes_gcm_encryption_roundtrip() {
        let password = "AegisCryptographicVault";
        let salt = b"0123456789abcdef";
        let key = derive_master_key(password, salt).expect("derive failed");

        let secret = "telegram_bot_token_secret_123456789";
        let encrypted_hex = encrypt_string(&key, secret).expect("encrypt failed");
        assert_ne!(secret, encrypted_hex);

        let decrypted = decrypt_string(&key, &encrypted_hex).expect("decrypt failed");
        assert_eq!(secret, decrypted);
    }
}
