import { query } from '../../boilerplate/db/index.js';

export const createAufgabe = async ({ titel, beschreibung, datum, uhrzeit, lehrerid }) => {
  const res = await query(
    `INSERT INTO aufgabe (titel, beschreibung, datum, uhrzeit, lehrerid)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [titel, beschreibung, datum, uhrzeit, lehrerid]
  );
  return res.rows[0];
};

export const getAufgaben = async () => {
  const res = await query('SELECT * FROM aufgabe ORDER BY datum, uhrzeit');
  return res.rows;
};

export const getAufgabeFuerLehrer = async (aufgabeid, lehrerid) => {
  const res = await query(
    'SELECT * FROM aufgabe WHERE aufgabeid=$1 AND lehrerid=$2',
    [aufgabeid, lehrerid]
  );
  return res.rows[0] || null;
};


export const getAufgabenVonSchueler = async (userid) => {
  const result = await query(
    `
   SELECT
  a.*,
  sa.status
FROM aufgabe a
JOIN schueler_aufgabe_anmeldung sa
  ON a.aufgabeid = sa.aufgabeid
WHERE sa.schueler_userid = $1
   `,
    [userid]
  );

  return result.rows;
};