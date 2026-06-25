const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'signage.db');
const db = new sqlite3.Database(dbPath);

// Helper function to run DB operations as Promises
const query = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

// SQLite helper implementation mimicking the firestore helpers
const firestoreHelpers = {
  async getById(collection, id) {
    const row = await query.get(`SELECT * FROM ${collection} WHERE id = ?`, [String(id)]);
    if (!row) return null;
    if (collection === 'playlists' && row.items) {
      try {
        row.items = JSON.parse(row.items);
      } catch (e) {
        row.items = [];
      }
    }
    return row;
  },

  async getWhere(collection, filters = []) {
    let sql = `SELECT * FROM ${collection}`;
    const params = [];
    if (filters.length > 0) {
      const clause = filters.map(f => {
        params.push(f.value);
        return `${f.field} ${f.op || '='} ?`;
      }).join(' AND ');
      sql += ` WHERE ${clause}`;
    }
    sql += ` LIMIT 1`;
    const row = await query.get(sql, params);
    if (!row) return null;
    if (collection === 'playlists' && row.items) {
      try {
        row.items = JSON.parse(row.items);
      } catch (e) {
        row.items = [];
      }
    }
    return row;
  },

  async getAll(collection, filters = [], options = {}) {
    let sql = `SELECT * FROM ${collection}`;
    const params = [];
    if (filters.length > 0) {
      const clause = filters.map(f => {
        params.push(f.value);
        return `${f.field} ${f.op || '='} ?`;
      }).join(' AND ');
      sql += ` WHERE ${clause}`;
    }
    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy} ${options.orderDir || 'ASC'}`;
    }
    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }
    const rows = await query.all(sql, params);
    return rows.map(row => {
      if (collection === 'playlists' && row.items) {
        try {
          row.items = JSON.parse(row.items);
        } catch (e) {
          row.items = [];
        }
      }
      return row;
    });
  },

  async add(collection, data) {
    const id = data.id || Math.random().toString(36).substr(2, 9);
    const finalData = { ...data, id };
    
    const now = new Date().toISOString();
    if (finalData.created_at === undefined) {
      finalData.created_at = now;
    }
    if (finalData.timestamp === undefined && collection === 'events') {
      finalData.timestamp = now;
    }

    if (collection === 'playlists' && finalData.items) {
      finalData.items = JSON.stringify(finalData.items);
    }

    const keys = Object.keys(finalData);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => finalData[k]);

    await query.run(`INSERT INTO ${collection} (${keys.join(', ')}) VALUES (${placeholders})`, values);
    return id;
  },

  async set(collection, id, data) {
    const exists = await query.get(`SELECT 1 FROM ${collection} WHERE id = ?`, [String(id)]);
    if (exists) {
      await this.update(collection, id, data);
    } else {
      await this.add(collection, { ...data, id });
    }
    return String(id);
  },

  async update(collection, id, data) {
    const finalData = { ...data };
    if (collection === 'playlists' && finalData.items) {
      finalData.items = JSON.stringify(finalData.items);
    }

    const keys = Object.keys(finalData).filter(k => k !== 'id');
    if (keys.length === 0) return;

    const values = [];
    const clause = keys.map(k => {
      const val = finalData[k];
      if (val && typeof val === 'object' && val.type === 'increment') {
        values.push(val.value);
        return `${k} = ${k} + ?`;
      } else {
        values.push(val);
        return `${k} = ?`;
      }
    }).join(', ');

    values.push(String(id));

    await query.run(`UPDATE ${collection} SET ${clause} WHERE id = ?`, values);
  },

  async delete(collection, id) {
    await query.run(`DELETE FROM ${collection} WHERE id = ?`, [String(id)]);
  },

  async deleteWhere(collection, filters = []) {
    let sql = `DELETE FROM ${collection}`;
    const params = [];
    if (filters.length > 0) {
      const clause = filters.map(f => {
        params.push(f.value);
        return `${f.field} ${f.op || '='} ?`;
      }).join(' AND ');
      sql += ` WHERE ${clause}`;
    }
    await query.run(sql, params);
  },

  increment(value = 1) {
    return { type: 'increment', value };
  },

  serverTimestamp() {
    return new Date().toISOString();
  }
};

async function addColumnIfNotExists(table, column, type) {
  try {
    const columns = await query.all(`PRAGMA table_info(${table})`);
    const columnNames = columns.map(c => c.name);
    if (!columnNames.includes(column)) {
      await query.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      console.log(`[Database Migration] Added column "${column}" to table "${table}".`);
    }
  } catch (err) {
    console.error(`[Database Migration] Failed to add column "${column}" to "${table}":`, err.message);
  }
}

// Initialization and seeding of default data
async function initDb() {
  try {
    // Create tables
    await query.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT,
        provider TEXT,
        google_uid TEXT,
        avatar TEXT,
        created_at TEXT
      )
    `);

    await query.run(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        store_name TEXT,
        default_duration TEXT,
        logo TEXT
      )
    `);

    await query.run(`
      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        filename TEXT,
        original_name TEXT,
        mime_type TEXT,
        size INTEGER,
        filepath TEXT,
        created_at TEXT
      )
    `);

    await query.run(`
      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        name TEXT,
        items TEXT,
        duration TEXT,
        transition TEXT,
        random_order INTEGER,
        loop_playback INTEGER,
        created_at TEXT
      )
    `);

    await query.run(`
      CREATE TABLE IF NOT EXISTS screens (
        id TEXT PRIMARY KEY,
        name TEXT,
        code TEXT UNIQUE,
        playlist_id TEXT,
        status TEXT,
        last_activity TEXT,
        created_at TEXT
      )
    `);

    await query.run(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        type TEXT,
        message TEXT,
        timestamp TEXT
      )
    `);

    await query.run(`
      CREATE TABLE IF NOT EXISTS licenseKeys (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE,
        plan TEXT,
        duration_days INTEGER,
        max_uses INTEGER,
        uses_count INTEGER,
        note TEXT,
        created_by TEXT,
        expires_at TEXT,
        is_active INTEGER,
        created_at TEXT
      )
    `);

    await query.run(`
      CREATE TABLE IF NOT EXISTS keyRedemptions (
        id TEXT PRIMARY KEY,
        key_id TEXT,
        user_id TEXT,
        redeemed_at TEXT,
        created_at TEXT
      )
    `);

    // Schema Migrations (Ensure columns exist on existing databases)
    await addColumnIfNotExists('users', 'plan', 'TEXT');
    await addColumnIfNotExists('users', 'subscription_status', 'TEXT');
    await addColumnIfNotExists('users', 'subscription_ends_at', 'TEXT');

    await addColumnIfNotExists('screens', 'is_associated', 'INTEGER');
    await addColumnIfNotExists('screens', 'ip_address', 'TEXT');

    await addColumnIfNotExists('events', 'screen_id', 'TEXT');
    await addColumnIfNotExists('events', 'event_type', 'TEXT');

    // Seed default settings
    const settingsExist = await query.get("SELECT 1 FROM settings WHERE id = 'config'");
    if (!settingsExist) {
      await query.run(
        "INSERT INTO settings (id, store_name, default_duration, logo) VALUES (?, ?, ?, ?)",
        ['config', 'Mon Magasin', '5', '']
      );
    }

    // Seed default admin
    const adminExist = await query.get("SELECT 1 FROM users WHERE email = 'admin@magasin.local'");
    if (!adminExist) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const userId = Math.random().toString(36).substr(2, 9);
      await query.run(
        "INSERT INTO users (id, email, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, 'admin@magasin.local', hashedPassword, 'Admin', 'user', new Date().toISOString()]
      );
      console.log('Database seeded: admin@magasin.local / admin123 created.');
    }

    // Seed super admin Hugu
    const huguExist = await query.get("SELECT 1 FROM users WHERE email = 'hugu@imagescreen.local'");
    if (!huguExist) {
      const hashedPassword = await bcrypt.hash('1234', 10);
      const userId = Math.random().toString(36).substr(2, 9);
      await query.run(
        "INSERT INTO users (id, email, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, 'hugu@imagescreen.local', hashedPassword, 'Hugu', 'admin', new Date().toISOString()]
      );
      console.log('Database seeded: hugu@imagescreen.local / 1234 (admin) created.');
    } else {
      await query.run("UPDATE users SET role = 'admin', name = 'Hugu' WHERE email = 'hugu@imagescreen.local'");
    }

    console.log('✅  SQLite Database successfully initialized.');
  } catch (error) {
    console.error('❌  SQLite init failed:', error);
    process.exit(1);
  }
}

module.exports = {
  fdb: firestoreHelpers,
  initDb
};
