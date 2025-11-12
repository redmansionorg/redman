import { Pool } from 'pg';

// 数据库连接池
export const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'redmansion',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 测试数据库连接
db.on('connect', (client) => {
  console.log('✅ Database connected');
});

db.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// 执行查询的辅助函数
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await db.query(text, params);
  return result.rows;
}

// 执行单行查询
export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await db.query(text, params);
  return result.rows[0] || null;
}

