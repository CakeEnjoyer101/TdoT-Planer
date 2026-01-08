import { query } from '../../boilerplate/db/index.js';

export const schuelerAnmelden = async (userid, aufgabeid) => {
  const exists = await query(
    'SELECT 1 FROM schueler_aufgabe_anmeldung WHERE schueler_userid=$1 AND aufgabeid=$2',
    [userid, aufgabeid]
  );
  if (exists.rows.length) throw new Error('Bereits angemeldet');

  const res = await query(
    'INSERT INTO schueler_aufgabe_anmeldung (schueler_userid, aufgabeid) VALUES ($1,$2) RETURNING *',
    [userid, aufgabeid]
  );
  return res.rows[0];
};

export const getSchuelerFuerAufgabe = async (aufgabeid) => {
  const res = await query(
    `SELECT sa.*, u.name, u.email, u.klasse
     FROM schueler_aufgabe_anmeldung sa
     JOIN user_account u ON u.userid = sa.schueler_userid
     WHERE sa.aufgabeid = $1`,
    [aufgabeid]
  );
  return res.rows;
};

export const updateAnmeldungStatus = async (anmeldung_id, status) => {
  const res = await query(
    'UPDATE schueler_aufgabe_anmeldung SET status=$1 WHERE anmeldung_id=$2 RETURNING *',
    [status, anmeldung_id]
  );
  return res.rows[0];
};
