import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database | null = null;

export async function getDb() {
  if (db) return db;

  db = await open({
    filename: './dev.db',
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_phone TEXT,
      customer_name TEXT,
      customer_email TEXT,
      total_amount INTEGER,
      status TEXT DEFAULT 'PENDING',
      delivery_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT,
      transaction_id TEXT,
      amount INTEGER,
      phone TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      current_stock INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 10,
      unit TEXT DEFAULT 'units',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      department TEXT,
      role TEXT,
      status TEXT DEFAULT 'ACTIVE',
      date_of_birth DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER,
      category TEXT,
      image_url TEXT,
      is_available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      event_date DATE,
      event_type TEXT,
      guest_count INTEGER,
      venue TEXT,
      notes TEXT,
      status TEXT DEFAULT 'PENDING',
      total_amount INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'USER',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

// Prisma-like interface
export const prisma = {
  order: {
    findMany: async (options?: any) => {
      const database = await getDb();
      let query = 'SELECT * FROM orders';
      const params: any[] = [];

      if (options?.where) {
        const conditions: string[] = [];
        if (options.where.status) {
          conditions.push('status = ?');
          params.push(options.where.status);
        }
        if (options.where.createdAt?.lt) {
          conditions.push('created_at < ?');
          params.push(options.where.createdAt.lt.toISOString());
        }
        if (options.where.customer_phone) {
          conditions.push('customer_phone = ?');
          params.push(options.where.customer_phone);
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      query += ' ORDER BY created_at DESC';

      return database.all(query, ...params);
    },
    findUnique: async (options: { where: { id: string } }) => {
      const database = await getDb();
      return database.get('SELECT * FROM orders WHERE id = ?', options.where.id);
    },
    create: async (options: { data: any }) => {
      const database = await getDb();
      const { id, customer_phone, customer_name, customer_email, total_amount, status, delivery_address } = options.data;
      await database.run(
        'INSERT INTO orders (id, customer_phone, customer_name, customer_email, total_amount, status, delivery_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
        id, customer_phone, customer_name || '', customer_email || '', total_amount, status || 'PENDING', delivery_address || ''
      );
      return { id, customer_phone, customer_name, customer_email, total_amount, status, delivery_address };
    },
    update: async (options: { where: { id: string }, data: any }) => {
      const database = await getDb();
      const updates: string[] = [];
      const params: any[] = [];

      if (options.data.status !== undefined) {
        updates.push('status = ?');
        params.push(options.data.status);
      }
      if (options.data.total_amount !== undefined) {
        updates.push('total_amount = ?');
        params.push(options.data.total_amount);
      }

      if (updates.length > 0) {
        params.push(options.where.id);
        await database.run(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, ...params);
      }
      return { id: options.where.id, ...options.data };
    }
  },
  inventoryItem: {
    findMany: async (options?: any) => {
      const database = await getDb();
      let query = 'SELECT * FROM inventory_items';
      const params: any[] = [];

      if (options?.where) {
        const conditions: string[] = [];
        if (options.where.isActive !== undefined) {
          conditions.push('is_active = ?');
          params.push(options.where.isActive ? 1 : 0);
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      return database.all(query, ...params);
    },
    create: async (options: { data: any }) => {
      const database = await getDb();
      const { name, current_stock, low_stock_threshold, unit } = options.data;
      const result = await database.run(
        'INSERT INTO inventory_items (name, current_stock, low_stock_threshold, unit) VALUES (?, ?, ?, ?)',
        name, current_stock || 0, low_stock_threshold || 10, unit || 'units'
      );
      return { id: result.lastID, name, current_stock, low_stock_threshold, unit };
    },
    update: async (options: { where: { id: number }, data: any }) => {
      const database = await getDb();
      const updates: string[] = [];
      const params: any[] = [];

      if (options.data.current_stock !== undefined) {
        updates.push('current_stock = ?');
        params.push(options.data.current_stock);
      }
      if (updates.length > 0) {
        params.push(options.where.id);
        await database.run(`UPDATE inventory_items SET ${updates.join(', ')} WHERE id = ?`, ...params);
      }
      return { id: options.where.id, ...options.data };
    }
  },
  employee: {
    findMany: async (options?: any) => {
      const database = await getDb();
      let query = 'SELECT * FROM employees';
      const params: any[] = [];

      if (options?.where) {
        const conditions: string[] = [];
        if (options.where.status) {
          conditions.push('status = ?');
          params.push(options.where.status);
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      return database.all(query, ...params);
    },
    create: async (options: { data: any }) => {
      const database = await getDb();
      const { name, email, phone, department, role, status, date_of_birth } = options.data;
      const result = await database.run(
        'INSERT INTO employees (name, email, phone, department, role, status, date_of_birth) VALUES (?, ?, ?, ?, ?, ?, ?)',
        name, email || '', phone || '', department || '', role || '', status || 'ACTIVE', date_of_birth || null
      );
      return { id: result.lastID, name, email, phone, department, role, status, date_of_birth };
    }
  },
  product: {
    findMany: async (options?: any) => {
      const database = await getDb();
      let query = 'SELECT * FROM products';
      const params: any[] = [];

      if (options?.where) {
        const conditions: string[] = [];
        if (options.where.category) {
          conditions.push('category = ?');
          params.push(options.where.category);
        }
        if (options.where.is_available !== undefined) {
          conditions.push('is_available = ?');
          params.push(options.where.is_available ? 1 : 0);
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      return database.all(query, ...params);
    },
    create: async (options: { data: any }) => {
      const database = await getDb();
      const { name, description, price, category, image_url, is_available } = options.data;
      const result = await database.run(
        'INSERT INTO products (name, description, price, category, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?)',
        name, description || '', price || 0, category || '', image_url || '', is_available !== undefined ? (is_available ? 1 : 0) : 1
      );
      return { id: result.lastID, name, description, price, category, image_url, is_available };
    }
  },
  event: {
    findMany: async (options?: any) => {
      const database = await getDb();
      let query = 'SELECT * FROM events';
      const params: any[] = [];

      if (options?.where) {
        const conditions: string[] = [];
        if (options.where.status) {
          conditions.push('status = ?');
          params.push(options.where.status);
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      return database.all(query, ...params);
    },
    create: async (options: { data: any }) => {
      const database = await getDb();
      const { customer_name, customer_phone, customer_email, event_date, event_type, guest_count, venue, notes, status, total_amount } = options.data;
      const result = await database.run(
        'INSERT INTO events (customer_name, customer_phone, customer_email, event_date, event_type, guest_count, venue, notes, status, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        customer_name, customer_phone, customer_email, event_date, event_type, guest_count || 0, venue || '', notes || '', status || 'PENDING', total_amount || 0
      );
      return { id: result.lastID, customer_name, customer_phone, customer_email, event_date, event_type, guest_count, venue, notes, status, total_amount };
    }
  },
  customer: {
    findMany: async (options?: any) => {
      const database = await getDb();
      let query = 'SELECT * FROM customers';
      return database.all(query);
    },
    findUnique: async (options: { where: { email?: string, id?: number } }) => {
      const database = await getDb();
      if (options.where.email) {
        return database.get('SELECT * FROM customers WHERE email = ?', options.where.email);
      }
      if (options.where.id) {
        return database.get('SELECT * FROM customers WHERE id = ?', options.where.id);
      }
      return null;
    },
    create: async (options: { data: any }) => {
      const database = await getDb();
      const { name, email, phone, address } = options.data;
      const result = await database.run(
        'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
        name, email || '', phone || '', address || ''
      );
      return { id: result.lastID, name, email, phone, address };
    }
  },
  user: {
    findMany: async () => {
      const database = await getDb();
      return database.all('SELECT * FROM users');
    },
    findUnique: async (options: { where: { username?: string } }) => {
      const database = await getDb();
      return database.get('SELECT * FROM users WHERE username = ?', options.where.username);
    },
    create: async (options: { data: any }) => {
      const database = await getDb();
      const { username, password, role } = options.data;
      const result = await database.run(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        username, password, role || 'USER'
      );
      return { id: result.lastID, username, password, role };
    }
  }
};
