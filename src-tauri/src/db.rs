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
        ",
    )
    .map_err(|e| format!("Error inicializando tablas SQLite: {}", e))?;

    // Seed categorías si está vacía
    let cat_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM categories", [], |r| r.get(0))
        .unwrap_or(0);

    if cat_count == 0 {
        let defaults = [
            "Comida & Bebida",
            "Vivienda & Renta",
            "Servicios (Luz, Internet, etc.)",
            "Transporte & Gasolina",
            "Salud & Médico",
            "Entretenimiento & Ocio",
            "Suscripciones",
            "Educación & Certs",
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
    }

    // Seed timeline maestro si está vacía
    let event_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM timeline_events", [], |r| r.get(0))
        .unwrap_or(0);

    if event_count == 0 {
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
    }

    // Seed métodos de pago si está vacía
    let pm_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM payment_methods", [], |r| r.get(0))
        .unwrap_or(0);

    if pm_count == 0 {
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
    }

    // Seed gastos recurrentes si está vacía
    let rec_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM recurring_expenses", [], |r| r.get(0))
        .unwrap_or(0);

    if rec_count == 0 {
        let default_recurring = [
            ("rec_internet", "Internet & Conectividad", 500.0, "Servicios (Luz, Internet, etc.)", "debito_principal", "monthly", 10, 0),
            ("rec_servicios", "Suscripción Digital", 150.0, "Suscripciones", "credito_principal", "monthly", 15, 1),
            ("rec_renta", "Vivienda / Renta", 3000.0, "Vivienda & Renta", "debito_principal", "monthly", 1, 0),
        ];

        for rec in default_recurring {
            let _ = conn.execute(
                "INSERT OR IGNORE INTO recurring_expenses 
                (id, description, amount, category, payment_method, frequency, due_day, auto_approve, last_paid_date)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, NULL)",
                params![rec.0, rec.1, rec.2, rec.3, rec.4, rec.5, rec.6, rec.7],
            );
        }
    }

    // Seed MSI si está vacía
    let msi_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM msi_plans", [], |r| r.get(0))
        .unwrap_or(0);

    if msi_count == 0 {
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
                "Educación & Certs"
            ],
        );
    }

    // Seed custom_games si está vacía (Plantillas genéricas iniciales)
    let cg_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM custom_games", [], |r| r.get(0))
        .unwrap_or(0);

    if cg_count == 0 {
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
    }

    Ok(())
}
