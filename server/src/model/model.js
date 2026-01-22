import { query } from '../../boilerplate/db/index.js';
import bcrypt from 'bcrypt';

export const findUserByEmail = async (email) => {
  const result = await query('SELECT * FROM user_account WHERE email = $1', [email]);
  return result.rows[0];
};

export const findUserById = async (userid) => {
  const result = await query('SELECT * FROM user_account WHERE userid = $1', [userid]);
  return result.rows[0];
};

export const createUser = async (email, name, password, lehrerid = null, klasse = null) => {
  const hashedPassword = await bcrypt.hash(password, 12);

  const result = await query(
    `INSERT INTO user_account (email, name, password_hash, lehrerid, klasse)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING userid, email, name, created_at, lehrerid, klasse`,
    [email, name, hashedPassword, lehrerid, klasse],
  );
  return result.rows[0];
};

// Neuen Lehrer erstellen
export const createLehrer = async (name, fachbereich = 'Allgemein') => {
  const result = await query('INSERT INTO lehrer (name, fachbereich) VALUES ($1, $2) RETURNING *', [
    name,
    fachbereich,
  ]);
  return result.rows[0];
};

export const verifyPassword = async (plainPassword, hashedPassword) => {
  if (!hashedPassword) return false;
  return await bcrypt.compare(plainPassword, hashedPassword);
};

export const isAdmin = async (userid) => {
  const result = await query('SELECT * FROM admin WHERE userid = $1', [userid]);
  return result.rows.length > 0;
};

export const getAdminDetails = async (userid) => {
  const result = await query(
    `SELECT u.*, a.role, a.created_at as admin_since
     FROM user_account u
     JOIN admin a ON u.userid = a.userid
     WHERE u.userid = $1`,
    [userid],
  );
  return result.rows[0];
};

// In model.js - createAufgabe anpassen
export const createAufgabe = async (data) => {
  const { titel, beschreibung, datum, uhrzeit, lehrerid } = data;
  const result = await query(
    `INSERT INTO aufgabe (titel, beschreibung, datum, uhrzeit, lehrerid)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [titel, beschreibung, datum, uhrzeit, lehrerid],
  );
  return result.rows[0];
};

export const getAufgaben = async () => {
  const result = await query('SELECT * FROM aufgabe ORDER BY datum ASC');
  return result.rows;
};

export const updateUserKlasse = async (userid, klasse) => {
  const result = await query('UPDATE user_account SET klasse = $1 WHERE userid = $2 RETURNING *', [
    klasse,
    userid,
  ]);
  return result.rows[0];
};

export const schuelerFuerAufgabeAnmelden = async (schuelerUserid, aufgabeid) => {
  // Prüfen ob bereits angemeldet
  const existing = await query(
    'SELECT * FROM schueler_aufgabe_anmeldung WHERE schueler_userid = $1 AND aufgabeid = $2',
    [schuelerUserid, aufgabeid],
  );

  if (existing.rows.length > 0) {
    throw new Error('Bereits für diese Aufgabe angemeldet');
  }

  const result = await query(
    'INSERT INTO schueler_aufgabe_anmeldung (schueler_userid, aufgabeid) VALUES ($1, $2) RETURNING *',
    [schuelerUserid, aufgabeid],
  );
  return result.rows[0];
};

// Lehrer für Aufgabe anmelden (Aufgabe übernehmen)
export const lehrerFuerAufgabeAnmelden = async (lehrerUserid, aufgabeid) => {
  const result = await query('UPDATE aufgabe SET lehrerid = $1 WHERE aufgabeid = $2 RETURNING *', [
    lehrerUserid,
    aufgabeid,
  ]);
  return result.rows[0];
};

export const getAngemeldeteSchuelerFuerAufgabe = async (aufgabeid) => {
  const result = await query(
    `SELECT
       sa.anmeldung_id,
       sa.schueler_userid,
       sa.angemeldet_am,
       sa.status,
       u.name,
       u.email,
       u.klasse
     FROM schueler_aufgabe_anmeldung sa
     JOIN user_account u ON sa.schueler_userid = u.userid
     WHERE sa.aufgabeid = $1
     ORDER BY sa.angemeldet_am ASC`,
    [aufgabeid],
  );
  return result.rows;
};

// Übernommene Aufgaben für Lehrer holen
export const getUebernommeneAufgabenFuerLehrer = async (lehrerUserid) => {
  const result = await query(
    `SELECT a.*, l.name as lehrer_name
     FROM aufgabe a
     LEFT JOIN lehrer l ON a.lehrerid = l.lehrerid
     WHERE a.lehrerid = $1
     ORDER BY a.datum, a.uhrzeit`,
    [lehrerUserid],
  );
  return result.rows;
};

export const updateSchuelerAnmeldungStatus = async (anmeldung_id, status) => {
  const result = await query(
    'UPDATE schueler_aufgabe_anmeldung SET status = $1 WHERE anmeldung_id = $2 RETURNING *',
    [status, anmeldung_id],
  );
  return result.rows[0];
};

export const getAngemeldeteAufgabenFuerSchueler = async (schuelerUserid) => {
  const result = await query(
    `SELECT
       a.*,
       sa.angemeldet_am,
       sa.status,
       sa.anmeldung_id
     FROM aufgabe a
     JOIN schueler_aufgabe_anmeldung sa ON a.aufgabeid = sa.aufgabeid
     WHERE sa.schueler_userid = $1
     ORDER BY a.datum, a.uhrzeit`,
    [schuelerUserid],
  );
  return result.rows;
};

// Prüfen ob Lehrer bereits für eine Aufgabe angemeldet ist
export const isLehrerAlreadyRegistered = async (lehrerid) => {
  const result = await query('SELECT * FROM aufgabe WHERE lehrerid = $1', [lehrerid]);
  return result.rows.length > 0;
};

// Lehrer von Aufgabe abmelden
export const lehrerVonAufgabeAbmelden = async (lehrerid) => {
  const result = await query('UPDATE aufgabe SET lehrerid = NULL WHERE lehrerid = $1 RETURNING *', [
    lehrerid,
  ]);
  return result.rows[0];
};

// Aktuelle Aufgabe des Lehrers holen
export const getAktuelleAufgabeFuerLehrer = async (lehrerid) => {
  const result = await query('SELECT * FROM aufgabe WHERE lehrerid = $1', [lehrerid]);
  return result.rows[0] || null;
};

// 👑 ADMIN: alle Aufgaben inkl. zugewiesenem Lehrer
export const getAlleAufgabenMitLehrer = async () => {
  const result = await query(
    `
    SELECT
      a.aufgabeid,
      a.titel,
      a.beschreibung,
      a.datum,
      a.uhrzeit,
      l.lehrerid,
      l.name AS lehrer_name
    FROM aufgabe a
    LEFT JOIN lehrer l ON a.lehrerid = l.lehrerid
    ORDER BY a.datum, a.uhrzeit
    `
  );

  return result.rows;
};

import crypto from 'crypto';

// Token setzen
export const setEmailVerificationToken = async (userid) => {
  const token = crypto.randomBytes(32).toString('hex');

  await query(
    `UPDATE user_account
     SET email_token = $1,
         email_token_expires = NOW() + INTERVAL '24 hours'
     WHERE userid = $2`,
    [token, userid]
  );

  return token;
};

// Token prüfen
export const verifyEmailByToken = async (token) => {
  const result = await query(
    `SELECT * FROM user_account
     WHERE email_token = $1
       AND email_token_expires > NOW()`,
    [token]
  );

  if (result.rows.length === 0) return null;

  const user = result.rows[0];

  await query(
    `UPDATE user_account
     SET email_verified = true,
         email_token = NULL,
         email_token_expires = NULL
     WHERE userid = $1`,
    [user.userid]
  );

  return user;
};
