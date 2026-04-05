import { query } from '../../boilerplate/db/index.js';

const columnExists = async (tableName, columnName) => {
  const result = await query(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
    `,
    [tableName, columnName],
  );

  return result.rows.length > 0;
};

const constraintExists = async (tableName, constraintName) => {
  const result = await query(
    `
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = $1
        AND constraint_name = $2
    `,
    [tableName, constraintName],
  );

  return result.rows.length > 0;
};

const indexExists = async (indexName) => {
  const result = await query(
    `
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = $1
    `,
    [indexName],
  );

  return result.rows.length > 0;
};

let schemaReadyPromise = null;

export const ensureSchema = async () => {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS aufgabe_lehrer (
          aufgabeid INTEGER NOT NULL REFERENCES aufgabe(aufgabeid) ON DELETE CASCADE,
          lehrerid INTEGER NOT NULL REFERENCES lehrer(lehrerid) ON DELETE CASCADE,
          assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (aufgabeid, lehrerid)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS schueler_entschuldigung (
          schueler_userid INTEGER NOT NULL REFERENCES user_account(userid) ON DELETE CASCADE,
          event_day SMALLINT NOT NULL,
          entschuldigt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (schueler_userid, event_day)
        )
      `);

      if (!(await columnExists('aufgabe', 'tag1_datum'))) {
        await query('ALTER TABLE aufgabe ADD COLUMN tag1_datum DATE');
      }

      if (!(await columnExists('aufgabe', 'tag1_uhrzeit'))) {
        await query('ALTER TABLE aufgabe ADD COLUMN tag1_uhrzeit TIME');
      }

      if (!(await columnExists('aufgabe', 'tag2_datum'))) {
        await query('ALTER TABLE aufgabe ADD COLUMN tag2_datum DATE');
      }

      if (!(await columnExists('aufgabe', 'tag2_uhrzeit'))) {
        await query('ALTER TABLE aufgabe ADD COLUMN tag2_uhrzeit TIME');
      }

      await query(`
        UPDATE aufgabe
        SET
          tag1_datum = COALESCE(tag1_datum, datum),
          tag1_uhrzeit = COALESCE(tag1_uhrzeit, uhrzeit),
          tag2_datum = COALESCE(tag2_datum, CAST(datum + INTERVAL '1 day' AS DATE)),
          tag2_uhrzeit = COALESCE(tag2_uhrzeit, uhrzeit)
      `);

      const hadEventDayColumn = await columnExists('schueler_aufgabe_anmeldung', 'event_day');
      if (!hadEventDayColumn) {
        await query('ALTER TABLE schueler_aufgabe_anmeldung ADD COLUMN event_day SMALLINT');
        await query('UPDATE schueler_aufgabe_anmeldung SET event_day = 1 WHERE event_day IS NULL');
        await query(`
          INSERT INTO schueler_aufgabe_anmeldung (
            schueler_userid,
            aufgabeid,
            status,
            angemeldet_am,
            event_day
          )
          SELECT
            schueler_userid,
            aufgabeid,
            status,
            angemeldet_am,
            2
          FROM schueler_aufgabe_anmeldung
          WHERE event_day = 1
        `);
      }

      await query('UPDATE schueler_aufgabe_anmeldung SET event_day = 1 WHERE event_day IS NULL');

      if (!(await columnExists('schueler_aufgabe_anmeldung', 'anwesend'))) {
        await query(
          'ALTER TABLE schueler_aufgabe_anmeldung ADD COLUMN anwesend BOOLEAN NOT NULL DEFAULT FALSE',
        );
      }

      if (!(await columnExists('schueler_aufgabe_anmeldung', 'anwesend_am'))) {
        await query('ALTER TABLE schueler_aufgabe_anmeldung ADD COLUMN anwesend_am TIMESTAMP');
      }

      await query(
        'UPDATE schueler_aufgabe_anmeldung SET anwesend = FALSE WHERE anwesend IS NULL',
      );

      await query(`
        UPDATE schueler_aufgabe_anmeldung
        SET anwesend_am = NULL
        WHERE COALESCE(anwesend, FALSE) = FALSE
      `);

      await query(`
        DELETE FROM schueler_aufgabe_anmeldung older
        USING schueler_aufgabe_anmeldung newer
        WHERE older.anmeldung_id < newer.anmeldung_id
          AND older.schueler_userid = newer.schueler_userid
          AND older.event_day = newer.event_day
          AND COALESCE(older.status, 'angemeldet') <> 'abgelehnt'
          AND COALESCE(newer.status, 'angemeldet') <> 'abgelehnt'
      `);

      if (!(await constraintExists('schueler_aufgabe_anmeldung', 'schueler_aufgabe_anmeldung_event_day_check'))) {
        await query(`
          ALTER TABLE schueler_aufgabe_anmeldung
          ADD CONSTRAINT schueler_aufgabe_anmeldung_event_day_check
          CHECK (event_day IN (1, 2))
        `);
      }

      if (!(await indexExists('schueler_aufgabe_anmeldung_unique_day_idx'))) {
        await query(`
          CREATE UNIQUE INDEX schueler_aufgabe_anmeldung_unique_day_idx
          ON schueler_aufgabe_anmeldung (schueler_userid, event_day)
          WHERE COALESCE(status, 'angemeldet') <> 'abgelehnt'
        `);
      }

      await query(`
        INSERT INTO aufgabe_lehrer (aufgabeid, lehrerid)
        SELECT aufgabeid, lehrerid
        FROM aufgabe
        WHERE lehrerid IS NOT NULL
        ON CONFLICT (aufgabeid, lehrerid) DO NOTHING
      `);

      await query(`
        UPDATE aufgabe a
        SET lehrerid = sub.lehrerid
        FROM (
          SELECT aufgabeid, MIN(lehrerid) AS lehrerid
          FROM aufgabe_lehrer
          GROUP BY aufgabeid
        ) sub
        WHERE a.aufgabeid = sub.aufgabeid
      `);
    })().catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }

  return schemaReadyPromise;
};
