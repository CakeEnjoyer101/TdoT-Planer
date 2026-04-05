import bcrypt from 'bcrypt';
import { query, pool } from '../../boilerplate/db/index.js';

const ACTIVE_REGISTRATION_STATUS_SQL = "COALESCE(sa.status, 'angemeldet') <> 'abgelehnt'";
const EVENT_DAYS = [1, 2];
const TASKS_WITH_TEACHERS_CTE = `
  WITH lehrer_zuordnung AS (
    SELECT al.aufgabeid, al.lehrerid
    FROM aufgabe_lehrer al
    UNION
    SELECT a.aufgabeid, a.lehrerid
    FROM aufgabe a
    WHERE a.lehrerid IS NOT NULL
  ),
  aufgaben_mit_lehrer AS (
    SELECT
      a.aufgabeid,
      a.titel,
      a.beschreibung,
      a.datum,
      a.uhrzeit,
      a.lehrerid,
      a.kategorie,
      a.icon,
      a.ziel_klassen,
      a.tag1_datum,
      a.tag1_uhrzeit,
      a.tag2_datum,
      a.tag2_uhrzeit,
      COALESCE(
        array_agg(DISTINCT l.lehrerid) FILTER (WHERE l.lehrerid IS NOT NULL),
        '{}'
      ) AS lehrer_ids,
      COALESCE(
        array_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL),
        '{}'
      ) AS lehrer_namen,
      COALESCE(string_agg(DISTINCT l.name, ', '), '') AS lehrer_name
    FROM aufgabe a
    LEFT JOIN lehrer_zuordnung lz ON a.aufgabeid = lz.aufgabeid
    LEFT JOIN lehrer l ON lz.lehrerid = l.lehrerid
    GROUP BY a.aufgabeid
  )
`;

const normalizeNullableString = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
};

const normalizeIdList = (values) => {
  if (!Array.isArray(values)) return [];

  return Array.from(
    new Set(
      values
        .map((value) => parseInt(value, 10))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );
};

const normalizeZielKlassen = (zielKlassen) => {
  if (!Array.isArray(zielKlassen)) return [];

  return Array.from(
    new Set(
      zielKlassen
        .map((klasse) => String(klasse || '').trim().toLowerCase())
        .filter(Boolean),
    ),
  );
};

const normalizeEventDay = (eventDay) => {
  if (eventDay === undefined || eventDay === null || eventDay === '') {
    return null;
  }

  const parsedDay = parseInt(eventDay, 10);
  return EVENT_DAYS.includes(parsedDay) ? parsedDay : null;
};

const requiresRegistrationForKlasse = (klasse) => {
  const normalized = String(klasse || '').trim().toLowerCase();
  if (!normalized || normalized === 'admin' || normalized === 'lehrer' || normalized === 'keine klasse') {
    return false;
  }

  return !normalized.startsWith('1') && !normalized.startsWith('5');
};

const syncLegacyLehrerIdForTask = async (client, aufgabeid) => {
  await client.query(
    `UPDATE aufgabe
     SET lehrerid = (
       SELECT MIN(lehrerid)
       FROM aufgabe_lehrer
       WHERE aufgabeid = $1
     )
     WHERE aufgabeid = $1`,
    [aufgabeid],
  );
};

const replaceTaskTeacherAssignments = async (client, aufgabeid, lehrerids) => {
  await client.query('DELETE FROM aufgabe_lehrer WHERE aufgabeid = $1', [aufgabeid]);

  for (const lehrerid of lehrerids) {
    await client.query(
      `INSERT INTO aufgabe_lehrer (aufgabeid, lehrerid)
       VALUES ($1, $2)
       ON CONFLICT (aufgabeid, lehrerid) DO NOTHING`,
      [aufgabeid, lehrerid],
    );
  }

  await client.query('UPDATE aufgabe SET lehrerid = $1 WHERE aufgabeid = $2', [
    lehrerids[0] ?? null,
    aufgabeid,
  ]);
};

const getExcusedDaysWithClient = async (client, schuelerUserid) => {
  const result = await client.query(
    `SELECT event_day
     FROM schueler_entschuldigung
     WHERE schueler_userid = $1`,
    [schuelerUserid],
  );

  return result.rows.map((row) => parseInt(row.event_day, 10)).filter((eventDay) => EVENT_DAYS.includes(eventDay));
};

const getActiveRegistrationsForUserWithClient = async (client, schuelerUserid) => {
  const result = await client.query(
    `SELECT anmeldung_id, aufgabeid, event_day, COALESCE(status, 'angemeldet') AS status
     FROM schueler_aufgabe_anmeldung sa
     WHERE sa.schueler_userid = $1
       AND ${ACTIVE_REGISTRATION_STATUS_SQL}`,
    [schuelerUserid],
  );

  return result.rows.map((row) => ({
    ...row,
    event_day: parseInt(row.event_day, 10),
  }));
};

const upsertRegistrationForDay = async (client, schuelerUserid, aufgabeid, eventDay) => {
  const existing = await client.query(
    `SELECT anmeldung_id, aufgabeid
     FROM schueler_aufgabe_anmeldung sa
     WHERE sa.schueler_userid = $1
       AND sa.event_day = $2
       AND ${ACTIVE_REGISTRATION_STATUS_SQL}
     ORDER BY sa.anmeldung_id DESC
     LIMIT 1`,
    [schuelerUserid, eventDay],
  );

  if (existing.rows.length > 0) {
    const current = existing.rows[0];

    if (current.aufgabeid === aufgabeid) {
      const unchanged = await client.query(
        'SELECT * FROM schueler_aufgabe_anmeldung WHERE anmeldung_id = $1',
        [current.anmeldung_id],
      );
      return unchanged.rows[0];
    }

    const updated = await client.query(
      `UPDATE schueler_aufgabe_anmeldung
       SET aufgabeid = $1,
           status = 'angemeldet',
           angemeldet_am = CURRENT_TIMESTAMP,
           anwesend = FALSE,
           anwesend_am = NULL
       WHERE anmeldung_id = $2
       RETURNING *`,
      [aufgabeid, current.anmeldung_id],
    );
    return updated.rows[0];
  }

  const inserted = await client.query(
    `INSERT INTO schueler_aufgabe_anmeldung (schueler_userid, aufgabeid, status, event_day)
     VALUES ($1, $2, 'angemeldet', $3)
     RETURNING *`,
    [schuelerUserid, aufgabeid, eventDay],
  );
  return inserted.rows[0];
};

const getTaskById = async (aufgabeid) => {
  const result = await query(
    `${TASKS_WITH_TEACHERS_CTE}
     SELECT *
     FROM aufgaben_mit_lehrer
     WHERE aufgabeid = $1`,
    [aufgabeid],
  );

  return result.rows[0] || null;
};

export { query };

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

export const createLehrer = async (name, fachbereich = 'Allgemein') => {
  const result = await query('INSERT INTO lehrer (name, fachbereich) VALUES ($1, $2) RETURNING *', [
    name,
    fachbereich,
  ]);
  return result.rows[0];
};

export const verifyPassword = async (plainPassword, hashedPassword) => {
  if (!hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
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

export const createAufgabe = async (data) => {
  const {
    titel,
    beschreibung,
    datum,
    uhrzeit,
    lehrerid,
    lehrerids,
    ziel_klassen: zielKlassen,
    kategorie = null,
    icon = null,
    tag1_datum: inputTag1Datum,
    tag1_uhrzeit: inputTag1Uhrzeit,
    tag2_datum: inputTag2Datum,
    tag2_uhrzeit: inputTag2Uhrzeit,
  } = data;

  const normalizedZielKlassen = normalizeZielKlassen(zielKlassen);
  const normalizedTeacherIds = normalizeIdList(
    Array.isArray(lehrerids) ? lehrerids : lehrerid !== null && lehrerid !== undefined ? [lehrerid] : [],
  );

  const tag1Datum = normalizeNullableString(inputTag1Datum) || normalizeNullableString(datum);
  const tag1Uhrzeit = normalizeNullableString(inputTag1Uhrzeit) || normalizeNullableString(uhrzeit);
  const tag2Datum = normalizeNullableString(inputTag2Datum) || tag1Datum;
  const tag2Uhrzeit = normalizeNullableString(inputTag2Uhrzeit) || tag1Uhrzeit;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO aufgabe (
        titel,
        beschreibung,
        datum,
        uhrzeit,
        lehrerid,
        ziel_klassen,
        kategorie,
        icon,
        tag1_datum,
        tag1_uhrzeit,
        tag2_datum,
        tag2_uhrzeit
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        titel,
        beschreibung,
        tag1Datum,
        tag1Uhrzeit,
        normalizedTeacherIds[0] ?? null,
        normalizedZielKlassen.length > 0 ? normalizedZielKlassen : null,
        normalizeNullableString(kategorie),
        normalizeNullableString(icon),
        tag1Datum,
        tag1Uhrzeit,
        tag2Datum,
        tag2Uhrzeit,
      ],
    );

    if (normalizedTeacherIds.length > 0) {
      await replaceTaskTeacherAssignments(client, result.rows[0].aufgabeid, normalizedTeacherIds);
    }

    await client.query('COMMIT');
    return getTaskById(result.rows[0].aufgabeid);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getAufgaben = async () => {
  const result = await query(
    `${TASKS_WITH_TEACHERS_CTE}
     SELECT *
     FROM aufgaben_mit_lehrer
     ORDER BY COALESCE(tag1_datum, datum) ASC, COALESCE(tag1_uhrzeit, uhrzeit) ASC, aufgabeid ASC`,
  );

  return result.rows;
};

export const findAufgabeById = async (aufgabeid) => getTaskById(aufgabeid);

export const updateUserKlasse = async (userid, klasse) => {
  const result = await query('UPDATE user_account SET klasse = $1 WHERE userid = $2 RETURNING *', [
    klasse,
    userid,
  ]);
  return result.rows[0];
};

export const schuelerFuerAufgabeAnmelden = async (schuelerUserid, aufgabeid, options = {}) => {
  const requestedEventDay = normalizeEventDay(options.event_day ?? options.eventDay);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const excusedDays = new Set(await getExcusedDaysWithClient(client, schuelerUserid));
    const activeRegistrations = await getActiveRegistrationsForUserWithClient(client, schuelerUserid);
    const assignedDays = new Set(activeRegistrations.map((row) => row.event_day));

    let targetDays = [];

    if (requestedEventDay !== null) {
      if (excusedDays.has(requestedEventDay)) {
        throw new Error(`Du bist fuer Tag ${requestedEventDay} entschuldigt`);
      }

      targetDays = [requestedEventDay];
    } else {
      targetDays = EVENT_DAYS.filter((eventDay) => !excusedDays.has(eventDay) && !assignedDays.has(eventDay));

      if (targetDays.length === 0) {
        throw new Error('Du bist bereits fuer alle nicht entschuldigten Tage eingeteilt');
      }
    }

    const registrations = [];

    for (const eventDay of targetDays) {
      const registration = await upsertRegistrationForDay(client, schuelerUserid, aufgabeid, eventDay);
      registrations.push(registration);
    }

    await client.query('COMMIT');
    return registrations;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const lehrerFuerAufgabeAnmelden = async (lehrerUserid, aufgabeid) => {
  const result = await setAufgabeFuerLehrer(lehrerUserid, aufgabeid);
  return result;
};

export const getAngemeldeteSchuelerFuerAufgabe = async (aufgabeid, eventDay = null) => {
  const normalizedEventDay = normalizeEventDay(eventDay);
  const params = [aufgabeid];
  let dayFilter = '';

  if (normalizedEventDay !== null) {
    params.push(normalizedEventDay);
    dayFilter = 'AND sa.event_day = $2';
  }

  const result = await query(
    `SELECT
       sa.anmeldung_id,
       sa.schueler_userid,
       sa.angemeldet_am,
       COALESCE(sa.anwesend, FALSE) AS anwesend,
       sa.anwesend_am,
       sa.event_day,
       COALESCE(sa.status, 'angemeldet') AS status,
       u.name,
       u.email,
       u.klasse
     FROM schueler_aufgabe_anmeldung sa
     JOIN user_account u ON sa.schueler_userid = u.userid
     WHERE sa.aufgabeid = $1
       ${dayFilter}
       AND ${ACTIVE_REGISTRATION_STATUS_SQL}
     ORDER BY sa.angemeldet_am ASC`,
    params,
  );
  return result.rows;
};

export const getUebernommeneAufgabenFuerLehrer = async (lehrerUserid) => {
  const result = await query(
    `${TASKS_WITH_TEACHERS_CTE}
     SELECT *
     FROM aufgaben_mit_lehrer
     WHERE $1 = ANY(lehrer_ids)
     ORDER BY COALESCE(tag1_datum, datum) ASC, COALESCE(tag1_uhrzeit, uhrzeit) ASC, aufgabeid ASC`,
    [lehrerUserid],
  );

  return result.rows;
};

export const updateSchuelerAnmeldungStatus = async (anmeldungId, status) => {
  const result = await query(
    'UPDATE schueler_aufgabe_anmeldung SET status = $1 WHERE anmeldung_id = $2 RETURNING *',
    [status, anmeldungId],
  );
  return result.rows[0];
};

export const getAngemeldeteAufgabenFuerSchueler = async (schuelerUserid) => {
  const result = await query(
    `${TASKS_WITH_TEACHERS_CTE}
     SELECT
       aml.*,
       sa.angemeldet_am,
       COALESCE(sa.anwesend, FALSE) AS anwesend,
       sa.anwesend_am,
       COALESCE(sa.status, 'angemeldet') AS status,
       sa.anmeldung_id,
       sa.event_day
     FROM schueler_aufgabe_anmeldung sa
     JOIN aufgaben_mit_lehrer aml ON aml.aufgabeid = sa.aufgabeid
     WHERE sa.schueler_userid = $1
       AND ${ACTIVE_REGISTRATION_STATUS_SQL}
     ORDER BY sa.event_day ASC, COALESCE(aml.tag1_datum, aml.datum) ASC, COALESCE(aml.tag1_uhrzeit, aml.uhrzeit) ASC`,
    [schuelerUserid],
  );
  return result.rows;
};

export const getSchuelerEntschuldigteTage = async (schuelerUserid) => {
  const result = await query(
    `SELECT event_day
     FROM schueler_entschuldigung
     WHERE schueler_userid = $1
     ORDER BY event_day ASC`,
    [schuelerUserid],
  );

  return result.rows.map((row) => parseInt(row.event_day, 10)).filter((eventDay) => EVENT_DAYS.includes(eventDay));
};

export const getSchuelerTagesplan = async (schuelerUserid) => {
  const [assignments, excusedDays] = await Promise.all([
    getAngemeldeteAufgabenFuerSchueler(schuelerUserid),
    getSchuelerEntschuldigteTage(schuelerUserid),
  ]);

  return {
    assignments,
    excused_days: excusedDays,
  };
};

export const isLehrerAlreadyRegistered = async (lehrerid) => {
  const result = await query(
    `SELECT 1
     FROM aufgabe_lehrer
     WHERE lehrerid = $1
     UNION
     SELECT 1
     FROM aufgabe
     WHERE lehrerid = $1
     LIMIT 1`,
    [lehrerid],
  );

  return result.rows.length > 0;
};

export const lehrerVonAufgabeAbmelden = async (lehrerid) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const affectedTasksResult = await client.query(
      `SELECT aufgabeid
       FROM aufgabe_lehrer
       WHERE lehrerid = $1
       UNION
       SELECT aufgabeid
       FROM aufgabe
       WHERE lehrerid = $1`,
      [lehrerid],
    );

    await client.query('DELETE FROM aufgabe_lehrer WHERE lehrerid = $1', [lehrerid]);
    await client.query('UPDATE aufgabe SET lehrerid = NULL WHERE lehrerid = $1', [lehrerid]);

    for (const row of affectedTasksResult.rows) {
      await syncLegacyLehrerIdForTask(client, row.aufgabeid);
    }

    await client.query('COMMIT');
    return affectedTasksResult.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getAktuelleAufgabeFuerLehrer = async (lehrerid) => {
  const result = await query(
    `${TASKS_WITH_TEACHERS_CTE}
     SELECT *
     FROM aufgaben_mit_lehrer
     WHERE $1 = ANY(lehrer_ids)
     ORDER BY COALESCE(tag1_datum, datum) ASC, COALESCE(tag1_uhrzeit, uhrzeit) ASC, aufgabeid ASC
     LIMIT 1`,
    [lehrerid],
  );

  return result.rows[0] || null;
};

export const getAlleLehrerAccounts = async () => {
  const result = await query(
    `SELECT
       u.userid,
       u.name,
       u.email,
       u.klasse,
       l.lehrerid,
       l.fachbereich
     FROM user_account u
     JOIN lehrer l ON u.lehrerid = l.lehrerid
     WHERE u.klasse = 'Lehrer'
     ORDER BY u.name ASC`,
  );

  return result.rows;
};

export const findLehrerById = async (lehrerid) => {
  const result = await query('SELECT lehrerid FROM lehrer WHERE lehrerid = $1', [lehrerid]);
  return result.rows[0] || null;
};

export const assignLehrerZuAufgabe = async (aufgabeid, lehrerids) => {
  const normalizedTeacherIds = normalizeIdList(lehrerids);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await replaceTaskTeacherAssignments(client, aufgabeid, normalizedTeacherIds);
    await client.query('COMMIT');
    return getTaskById(aufgabeid);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const setAufgabeFuerLehrer = async (lehrerid, aufgabeid) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const affectedTasksResult = await client.query(
      `SELECT aufgabeid
       FROM aufgabe_lehrer
       WHERE lehrerid = $1
       UNION
       SELECT aufgabeid
       FROM aufgabe
       WHERE lehrerid = $1`,
      [lehrerid],
    );

    const affectedTaskIds = new Set(affectedTasksResult.rows.map((row) => row.aufgabeid));
    if (aufgabeid !== null) {
      affectedTaskIds.add(aufgabeid);
    }

    await client.query('DELETE FROM aufgabe_lehrer WHERE lehrerid = $1', [lehrerid]);
    await client.query('UPDATE aufgabe SET lehrerid = NULL WHERE lehrerid = $1', [lehrerid]);

    if (aufgabeid !== null) {
      await client.query(
        `INSERT INTO aufgabe_lehrer (aufgabeid, lehrerid)
         VALUES ($1, $2)
         ON CONFLICT (aufgabeid, lehrerid) DO NOTHING`,
        [aufgabeid, lehrerid],
      );
    }

    for (const taskId of affectedTaskIds) {
      await syncLegacyLehrerIdForTask(client, taskId);
    }

    await client.query('COMMIT');
    return aufgabeid === null ? null : getTaskById(aufgabeid);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const istLehrerFuerAufgabeZustaendig = async (lehrerid, aufgabeid) => {
  const result = await query(
    `SELECT 1
     FROM aufgabe_lehrer
     WHERE aufgabeid = $1 AND lehrerid = $2
     UNION
     SELECT 1
     FROM aufgabe
     WHERE aufgabeid = $1 AND lehrerid = $2
     LIMIT 1`,
    [aufgabeid, lehrerid],
  );
  return result.rows.length > 0;
};

export const removeSchuelerAnmeldungFuerLehrer = async (anmeldungId, lehrerid) => {
  const result = await query(
    `DELETE FROM schueler_aufgabe_anmeldung sa
     USING aufgabe a
     WHERE sa.anmeldung_id = $1
       AND sa.aufgabeid = a.aufgabeid
       AND (
         EXISTS (
           SELECT 1
           FROM aufgabe_lehrer al
           WHERE al.aufgabeid = a.aufgabeid
             AND al.lehrerid = $2
         )
         OR a.lehrerid = $2
       )
     RETURNING sa.*`,
    [anmeldungId, lehrerid],
  );

  return result.rows[0] || null;
};

export const setSchuelerAnwesenheitFuerLehrer = async (anmeldungId, lehrerid, anwesend) => {
  const result = await query(
    `UPDATE schueler_aufgabe_anmeldung sa
     SET anwesend = $3,
         anwesend_am = CASE
           WHEN $3 THEN COALESCE(sa.anwesend_am, CURRENT_TIMESTAMP)
           ELSE NULL
         END
     FROM aufgabe a
     WHERE sa.anmeldung_id = $1
       AND sa.aufgabeid = a.aufgabeid
       AND ${ACTIVE_REGISTRATION_STATUS_SQL}
       AND (
         EXISTS (
           SELECT 1
           FROM aufgabe_lehrer al
           WHERE al.aufgabeid = a.aufgabeid
             AND al.lehrerid = $2
         )
         OR a.lehrerid = $2
       )
     RETURNING sa.*`,
    [anmeldungId, lehrerid, anwesend],
  );

  return result.rows[0] || null;
};

export const setSchuelerEntschuldigteTage = async (schuelerUserid, eventDays) => {
  const normalizedDays = Array.from(
    new Set(
      eventDays
        .map((eventDay) => normalizeEventDay(eventDay))
        .filter((eventDay) => eventDay !== null),
    ),
  ).sort((left, right) => left - right);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM schueler_entschuldigung WHERE schueler_userid = $1', [schuelerUserid]);

    for (const eventDay of normalizedDays) {
      await client.query(
        `INSERT INTO schueler_entschuldigung (schueler_userid, event_day)
         VALUES ($1, $2)
         ON CONFLICT (schueler_userid, event_day) DO NOTHING`,
        [schuelerUserid, eventDay],
      );
    }

    if (normalizedDays.length > 0) {
      await client.query(
        `DELETE FROM schueler_aufgabe_anmeldung
         WHERE schueler_userid = $1
           AND event_day = ANY($2::smallint[])`,
        [schuelerUserid, normalizedDays],
      );
    }

    await client.query('COMMIT');
    return normalizedDays;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getAdminSchuelerUebersicht = async () => {
  const [studentsResult, registrationsResult, excusesResult] = await Promise.all([
    query(
      `SELECT userid, name, email, klasse
       FROM user_account
       WHERE COALESCE(klasse, '') NOT IN ('', 'Admin', 'Lehrer', 'Keine Klasse')
       ORDER BY name ASC`,
    ),
    query(
      `${TASKS_WITH_TEACHERS_CTE}
       SELECT
         sa.schueler_userid,
         sa.event_day,
         sa.anmeldung_id,
         sa.angemeldet_am,
         COALESCE(sa.status, 'angemeldet') AS status,
         aml.*
       FROM schueler_aufgabe_anmeldung sa
       JOIN aufgaben_mit_lehrer aml ON aml.aufgabeid = sa.aufgabeid
       WHERE ${ACTIVE_REGISTRATION_STATUS_SQL}`,
    ),
    query(
      `SELECT schueler_userid, event_day
       FROM schueler_entschuldigung`,
    ),
  ]);

  const assignmentsByStudent = new Map();
  for (const row of registrationsResult.rows) {
    const studentAssignments = assignmentsByStudent.get(row.schueler_userid) || {};
    studentAssignments[row.event_day] = row;
    assignmentsByStudent.set(row.schueler_userid, studentAssignments);
  }

  const excusesByStudent = new Map();
  for (const row of excusesResult.rows) {
    const current = excusesByStudent.get(row.schueler_userid) || new Set();
    current.add(parseInt(row.event_day, 10));
    excusesByStudent.set(row.schueler_userid, current);
  }

  const students = studentsResult.rows.map((student) => {
    const studentAssignments = assignmentsByStudent.get(student.userid) || {};
    const excusedDays = Array.from(excusesByStudent.get(student.userid) || []).sort((left, right) => left - right);
    const excusedDaySet = new Set(excusedDays);
    const requiresRegistration = requiresRegistrationForKlasse(student.klasse);
    const missingDays = requiresRegistration
      ? EVENT_DAYS.filter((eventDay) => !excusedDaySet.has(eventDay) && !studentAssignments[eventDay])
      : [];

    return {
      ...student,
      requires_registration: requiresRegistration,
      assignments_by_day: {
        1: studentAssignments[1] || null,
        2: studentAssignments[2] || null,
      },
      excused_days: excusedDays,
      missing_days: missingDays,
    };
  });

  return {
    students,
    missing_registrations: students.filter((student) => student.missing_days.length > 0),
  };
};

export const getAlleAufgabenMitLehrer = async () => getAufgaben();
