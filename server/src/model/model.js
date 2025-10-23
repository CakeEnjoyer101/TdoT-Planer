import { query } from '../../boilerplate/db/index.js';

export const findUserByEmail = async (email) => {
  const result = await query('SELECT * FROM user_account WHERE email = $1', [email]);
  return result.rows[0];
};

export const findUserById = async (userid) => {
  const result = await query('SELECT * FROM user_account WHERE userid = $1', [userid]);
  return result.rows[0];
};

export const createUser = async (email, name) => {
  const result = await query(
    `INSERT INTO user_account (email, name) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [email, name],
  );
  return result.rows[0];
};

export const isAdmin = async (userid) => {
  const result = await query('SELECT * FROM admin WHERE userid = $1', [userid]);
  return result.rows.length > 0;
};

export const createAufgabe = async (data) => {
  const { titel, beschreibung, datum, uhrzeit, tagid, lehrerid, leiterid } = data;
  const result = await query(
    `INSERT INTO aufgabe (titel, beschreibung, datum, uhrzeit, tagid, lehrerid, leiterid)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [titel, beschreibung, datum, uhrzeit, tagid, lehrerid, leiterid],
  );
  return result.rows[0];
};

export const getAufgaben = async () => {
  const result = await query('SELECT * FROM aufgabe ORDER BY datum ASC');
  return result.rows;
};
