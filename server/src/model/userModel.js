import { query } from '../../boilerplate/db/index.js';
import bcrypt from 'bcrypt';

export const findUserByEmail = async (email) => {
  const res = await query('SELECT * FROM user_account WHERE email = $1', [email]);
  return res.rows[0];
};

export const findUserById = async (userid) => {
  const res = await query('SELECT * FROM user_account WHERE userid = $1', [userid]);
  return res.rows[0];
};

export const createUser = async (email, name, password, lehrerid = null, klasse = null) => {
  const hash = await bcrypt.hash(password, 12);
  const res = await query(
    `INSERT INTO user_account (email, name, password_hash, lehrerid, klasse)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING userid, email, name, klasse, lehrerid`,
    [email, name, hash, lehrerid, klasse]
  );
  return res.rows[0];
};

export const verifyPassword = async (plain, hash) => {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
};

export const updateUserKlasse = async (userid, klasse) => {
  const res = await query(
    'UPDATE user_account SET klasse=$1 WHERE userid=$2 RETURNING *',
    [klasse, userid]
  );
  return res.rows[0];
};

export const isAdmin = async (userid) => {
  const res = await query('SELECT 1 FROM admin WHERE userid=$1', [userid]);
  return res.rows.length > 0;
};

export const getAllSchueler = async (klasse = null, search = null) => {
  let sql = `
    SELECT userid, name, email, klasse
    FROM user_account
    WHERE klasse NOT IN ('Admin','Lehrer')
  `;
  const params = [];

  if (klasse && klasse !== 'alle') {
    params.push(klasse);
    sql += ` AND klasse = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
  }

  sql += ' ORDER BY klasse, name';

  const res = await query(sql, params);
  return res.rows;
};
