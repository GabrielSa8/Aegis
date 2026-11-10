use rusqlite::{params, Connection};
use std::fs;
use std::path::PathBuf;

pub fn get_db_paths() -> (PathBuf, PathBuf) {
    let dir = if let Ok(xdg) = std::env::var("XDG_DATA_HOME") {
        if !xdg.is_empty() {
            PathBuf::from(xdg).join("aegis")
        } else {
            let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
            PathBuf::from(home).join(".local/share/aegis")
        }
    } else if let Ok(home) = std::env::var("HOME") {
        PathBuf::from(home).join(".local/share/aegis")
    } else {
        PathBuf::from(".aegis_data")
    };
    let file = dir.join("aegis_lifeos.db");
    (dir, file)
}

pub fn get_db_connection() -> Result<Connection, String> {
    let (db_dir, db_path) = get_db_paths();
    if !db_dir.exists() {
        fs::create_dir_all(&db_dir)
            .map_err(|e| format!("Error creando carpeta {}: {}", db_dir.display(), e))?;
    }
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Error abriendo SQLite {}: {}", db_path.display(), e))?;
    init_db_schema(&conn)?;
    Ok(conn)
}

pub fn init_db_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

        CREATE TABLE IF NOT EXISTS budgets (
            category TEXT PRIMARY KEY,
            amount REAL NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS categories (
            name TEXT PRIMARY KEY,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS snapshots (
            id TEXT PRIMARY KEY,
            timestamp INTEGER NOT NULL,
            date TEXT NOT NULL,
            transactions_count INTEGER NOT NULL,
            data_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS timeline_events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            domain TEXT NOT NULL,
            event_type TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT,
            location TEXT,
            details TEXT,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events(date);

        -- Tablas v2.1.0: Sesiones y Mensajes del Agente Táctico
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            context_id TEXT NOT NULL,
            effort TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updated_at DESC);

        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            context TEXT,
            effort TEXT,
            created_at TEXT NOT NULL,
            duration_seconds REAL,
            total_tokens INTEGER,
            input_tokens INTEGER,
            output_tokens INTEGER,
            FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at ASC);

        -- Tablas v2.2.0: Métodos de Pago, MSI y Gastos Recurrentes
        CREATE TABLE IF NOT EXISTS payment_methods (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL, -- 'credit', 'debit', 'cash', 'crypto'
            color TEXT,
            cutoff_day INTEGER,
            payment_day INTEGER,
            balance REAL NOT NULL DEFAULT 0.0,
            credit_limit REAL DEFAULT 0.0
        );

        CREATE TABLE IF NOT EXISTS msi_plans (
            id TEXT PRIMARY KEY,
            description TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            total_amount REAL NOT NULL,
            total_installments INTEGER NOT NULL,
            remaining_installments INTEGER NOT NULL,
            monthly_amount REAL NOT NULL,
            start_date TEXT NOT NULL,
            next_due_date TEXT NOT NULL,
            status TEXT NOT NULL, -- 'active', 'completed', 'cancelled'
            category TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS recurring_expenses (
            id TEXT PRIMARY KEY,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            frequency TEXT NOT NULL, -- 'monthly', 'biweekly', 'weekly'
            due_day INTEGER NOT NULL,
            auto_approve INTEGER NOT NULL DEFAULT 0,
            last_paid_date TEXT
        );

        -- Tablas v2.7.0: Gaming & Lanzadores Personalizados
        CREATE TABLE IF NOT EXISTS custom_games (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            launch_type TEXT NOT NULL, -- 'url', 'flatpak', 'cmd', 'steam'
            launch_target TEXT NOT NULL,
            description TEXT,
            banner_url TEXT,
            play_time_minutes INTEGER NOT NULL DEFAULT 0,
            last_played TEXT,
            created_at TEXT NOT NULL
        );

        -- Tablas v2.7.0 (Fase 7.4): Registro de Sesiones, Tiempos, Reseñas y Logros
        CREATE TABLE IF NOT EXISTS game_sessions (
            id TEXT PRIMARY KEY,
            game_id TEXT NOT NULL,
            game_title TEXT NOT NULL,
            is_steam INTEGER NOT NULL,
            duration_seconds INTEGER NOT NULL,
            started_at TEXT NOT NULL,
            ended_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_game_sessions_game ON game_sessions(game_id, started_at DESC);

        CREATE TABLE IF NOT EXISTS game_stats (
            game_id TEXT PRIMARY KEY,
            game_title TEXT NOT NULL,
            is_steam INTEGER NOT NULL,
            total_play_time_seconds INTEGER NOT NULL DEFAULT 0,
            sessions_count INTEGER NOT NULL DEFAULT 0,
            rating INTEGER DEFAULT 0,
            review TEXT,
            obsidian_note_path TEXT,
            last_played TEXT
        );

        CREATE TABLE IF NOT EXISTS custom_achievements (
            id TEXT PRIMARY KEY,
            game_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            unlocked INTEGER NOT NULL DEFAULT 0,
            unlocked_at TEXT,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_custom_achievements_game ON custom_achievements(game_id);

        CREATE TABLE IF NOT EXISTS game_achievement_unlocks (
            game_id TEXT NOT NULL,
            achievement_id TEXT NOT NULL,
            unlocked INTEGER NOT NULL DEFAULT 1,
            unlocked_at TEXT,
            PRIMARY KEY (game_id, achievement_id)
        );
        CREATE INDEX IF NOT EXISTS idx_game_achievement_unlocks ON game_achievement_unlocks(game_id);

        -- Tabla v2.13.5: Catálogo Unificado Multi-Dispositivo & Sincronización P2P
        CREATE TABLE IF NOT EXISTS game_catalog (
            game_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            app_id TEXT,
            is_steam INTEGER NOT NULL DEFAULT 1,
            cover_url TEXT,
            banner_url TEXT,
            total_play_time_seconds INTEGER NOT NULL DEFAULT 0,
            achievements_unlocked INTEGER NOT NULL DEFAULT 0,
            achievements_total INTEGER NOT NULL DEFAULT 0,
            achievements_json TEXT,
            last_played_device TEXT,
            last_played TEXT,
            updated_at INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_game_catalog_updated ON game_catalog(updated_at DESC);

        -- Tabla v2.19.0: Partidas Guardadas (Game Saves) y Sincronización Soberana P2P
        CREATE TABLE IF NOT EXISTS game_saves (
            game_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            app_id TEXT,
            save_path TEXT NOT NULL,
            sync_enabled INTEGER NOT NULL DEFAULT 1,
            last_saved_at INTEGER NOT NULL DEFAULT 0,
            backup_path TEXT,
            checksum TEXT,
            file_size_bytes INTEGER NOT NULL DEFAULT 0,
            device_source TEXT,
            updated_at INTEGER NOT NULL DEFAULT 0
        );

        -- Tablas v2.1.6: Hermes Cortex (Logger de Hábitos y Auto-Evolución)
        CREATE TABLE IF NOT EXISTS cortex_habits (
            topic TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            hit_count INTEGER NOT NULL DEFAULT 1,
            error_count INTEGER NOT NULL DEFAULT 0,
            sample_prompt TEXT,
            last_context TEXT,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cortex_proposals (
            id TEXT PRIMARY KEY,
            topic TEXT NOT NULL,
            title TEXT NOT NULL,
            reason TEXT NOT NULL,
            skill_slug TEXT NOT NULL,
            skill_markdown TEXT NOT NULL,
            profile_note TEXT NOT NULL,
            hit_count INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'dismissed'
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS db_metadata (
            key TEXT PRIMARY KEY,
            value TEXT
        );
        ",
    )
    .map_err(|e| format!("Error inicializando tablas SQLite: {}", e))?;

    // Asegurar siempre categorías semánticas dedicadas para compromisos y gastos fijos
    let _ = conn.execute(
        "INSERT OR IGNORE INTO categories (name, created_at) VALUES ('Planes MSI', datetime('now'))",
        [],
    );
    let _ = conn.execute(
        "INSERT OR IGNORE INTO categories (name, created_at) VALUES ('Gastos Fijos', datetime('now'))",
        [],
    );

    // Migración correctiva: planes MSI históricos que quedaron con categoría mock 'Educación & Certs'
    let _ = conn.execute(
        "UPDATE msi_plans SET category = 'Planes MSI' WHERE category = 'Educación & Certs'",
        [],
    );
    let _ = conn.execute(
        "UPDATE transactions SET category = 'Planes MSI' WHERE category = 'Educación & Certs' AND description LIKE 'Mensualidad MSI%'",
        [],
    );

    // Control de siembra única: nunca re-sembrar mocks si el usuario vacía sus listas
    let initial_seed_done: bool = conn
        .query_row(
            "SELECT 1 FROM db_metadata WHERE key = 'initial_seed_done' AND value = 'true'",
            [],
            |_| Ok(true),
        )
        .unwrap_or(false);

    let has_existing_records: bool = conn
        .query_row("SELECT 1 FROM payment_methods LIMIT 1", [], |_| Ok(true))
        .unwrap_or(false)
        || conn
            .query_row("SELECT 1 FROM transactions LIMIT 1", [], |_| Ok(true))
            .unwrap_or(false)
        || conn
            .query_row("SELECT 1 FROM msi_plans LIMIT 1", [], |_| Ok(true))
            .unwrap_or(false);

    if !initial_seed_done && has_existing_records {
        // Base de datos preexistente en uso: marcar inicialización completada para evitar recrear mocks
        let _ = conn.execute(
            "INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('initial_seed_done', 'true')",
            [],
        );
    }

    let should_seed = !initial_seed_done && !has_existing_records;

    if should_seed {
        let defaults = [
            "Comida & Bebida",
            "Vivienda & Renta",
            "Servicios (Luz, Internet, etc.)",
            "Transporte & Gasolina",
            "Salud & Médico",
            "Entretenimiento & Ocio",
            "Suscripciones",
            "Educación & Certs",
            "Planes MSI",
            "Gastos Fijos",
            "Nómina & Sueldos",
            "Ingresos Profesionales",
            "Otros",
        ];
        for cat in defaults {
            let _ = conn.execute(
                "INSERT OR IGNORE INTO categories (name, created_at) VALUES (?1, datetime('now'))",
                params![cat],
            );
        }

        // Seed timeline maestro
        let seed_events = [
            (
                "evt_demo_cierre",
                "Cierre Mensual & Conciliación",
                "work",
                "cierre_ciclo",
                "2026-11-22",
                Some("18:00"),
                Some("Oficina / Entorno Principal"),
                Some("Corte de ciclo mensual, conciliación financiera y balance."),
                "pending",
                "high",
            ),
            (
                "evt_demo_sprint",
                "Sprint Review & Release",
                "software",
                "sprint",
                "2026-10-29",
                Some("10:00"),
                Some("Entorno de Desarrollo"),
                Some("Revisión de arquitectura, validación de tests y despliegue."),
                "pending",
                "high",
            ),
            (
                "evt_demo_exam",
                "Sesión de Estudio & Certificación",
                "certs",
                "exam",
                "2026-10-31",
                Some("16:00"),
                Some("Bóveda de Conocimiento"),
                Some("Repaso de flashcards y simulación de prueba técnica."),
                "pending",
                "high",
            ),
            (
                "evt_demo_personal",
                "Revisión de Objetivos Personales",
                "personal",
                "review",
                "2026-11-05",
                Some("20:00"),
                Some("Personal"),
                Some("Planificación quincenal y auditoría de hábitos."),
                "pending",
                "medium",
            ),
        ];

        for ev in seed_events {
            let _ = conn.execute(
                "INSERT OR IGNORE INTO timeline_events 
                (id, title, domain, event_type, date, time, location, details, status, priority, created_at)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, datetime('now'))",
                params![ev.0, ev.1, ev.2, ev.3, ev.4, ev.5, ev.6, ev.7, ev.8, ev.9],
            );
        }

        // Seed métodos de pago
        let default_methods = [
            ("debito_principal", "Tarjeta Débito Principal", "debit", "#004481", None, None, 0.0, 0.0),
            ("credito_principal", "Tarjeta Crédito Principal", "credit", "#10b981", Some(5), Some(25), 0.0, 20000.0),
            ("billetera_digital", "Billetera Digital", "debit", "#009ee3", None, None, 0.0, 0.0),
            ("cash", "Efectivo", "cash", "#788882", None, None, 0.0, 0.0),
        ];

        for pm in default_methods {
            let _ = conn.execute(
                "INSERT OR IGNORE INTO payment_methods 
                (id, name, type, color, cutoff_day, payment_day, balance, credit_limit)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![pm.0, pm.1, pm.2, pm.3, pm.4, pm.5, pm.6, pm.7],
            );
        }

        // Seed gastos recurrentes
        let default_recurring = [
            ("rec_internet", "Internet & Conectividad", 500.0, "Gastos Fijos", "debito_principal", "monthly", 10, 0),
            ("rec_servicios", "Suscripción Digital", 150.0, "Suscripciones", "credito_principal", "monthly", 15, 1),
            ("rec_renta", "Vivienda / Renta", 3000.0, "Gastos Fijos", "debito_principal", "monthly", 1, 0),
        ];

        for rec in default_recurring {
            let _ = conn.execute(
                "INSERT OR IGNORE INTO recurring_expenses 
                (id, description, amount, category, payment_method, frequency, due_day, auto_approve, last_paid_date)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, NULL)",
                params![rec.0, rec.1, rec.2, rec.3, rec.4, rec.5, rec.6, rec.7],
            );
        }

        // Seed MSI
        let _ = conn.execute(
            "INSERT OR IGNORE INTO msi_plans 
            (id, description, payment_method, total_amount, total_installments, remaining_installments, monthly_amount, start_date, next_due_date, status, category)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                "msi_equipo",
                "Equipo de Trabajo",
                "credito_principal",
                3000.0,
                6,
                3,
                500.0,
                "2026-08-15",
                "2026-11-05",
                "active",
                "Planes MSI"
            ],
        );

        // Seed custom_games
        let default_custom_games = [
            (
                "cg_pokerogue",
                "PokéRogue",
                "Web Roguelike",
                "url",
                "https://pokerogue.net",
                Some("Combates por turnos procedimentales en navegador."),
                Some("https://raw.githubusercontent.com/pagefaultgames/pokerogue/main/public/images/app_icons/logo.png")
            ),
            (
                "cg_mgba",
                "mGBA / Emulador GBA",
                "Emulación",
                "cmd",
                "flatpak run io.mgba.mGBA",
                Some("Emulador de Game Boy Advance de alta fidelidad."),
                None
            ),
            (
                "cg_lichess",
                "Lichess",
                "Estrategia Web",
                "url",
                "https://lichess.org",
                Some("Servidor de ajedrez libre y de código abierto."),
                None
            ),
        ];

        for g in default_custom_games {
            let _ = conn.execute(
                "INSERT OR IGNORE INTO custom_games
                (id, title, category, launch_type, launch_target, description, banner_url, play_time_minutes, last_played, created_at)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0, NULL, datetime('now'))",
                params![g.0, g.1, g.2, g.3, g.4, g.5, g.6],
            );
        }

        // Marcar metadato de siembra única completada
        let _ = conn.execute(
            "INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('initial_seed_done', 'true')",
            [],
        );
    }

    Ok(())
}
