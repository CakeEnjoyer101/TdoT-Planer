import * as model from '../model/model.js';

export const getProfile = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  const isAdminUser = await model.isAdmin(req.user.userid);

  return res.json({
    user: req.user,
    isAdmin: isAdminUser,
  });
};

export const createAufgabe = async (req, res) => {
  try {
    const lehrerids = model.normalizeLehrerIds(req.body?.lehrerids ?? req.body?.lehrerid);
    if (lehrerids.length > 0) {
      const gefundeneLehrer = await model.getLehrerByIds(lehrerids);
      if (gefundeneLehrer.length !== lehrerids.length) {
        return res.status(404).json({ error: 'Mindestens ein ausgewaehlter Lehrer wurde nicht gefunden.' });
      }
    }

    const aufgabe = await model.createAufgabe({
      ...req.body,
      lehrerids,
    });

    return res.status(201).json(aufgabe);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message || 'Aufgabe konnte nicht erstellt werden.' });
  }
};

export const getAufgaben = async (req, res) => {
  try {
    const data = await model.getAufgaben();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
};

export const logout = (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.sendStatus(200);
    });
  });
};

export const getAngemeldeteSchueler = async (req, res) => {
  try {
    const { aufgabeid } = req.params;

    // Prüfen ob der Lehrer für diese Aufgabe angemeldet ist
    const aufgabe = await model.query(
      'SELECT * FROM aufgabe WHERE aufgabeid = $1 AND lehrerid = $2',
      [aufgabeid, req.user.lehrerid],
    );

    if (aufgabe.rows.length === 0) {
      return res.status(403).json({ error: 'Keine Berechtigung für diese Aufgabe' });
    }

    const schueler = await model.getAngemeldeteSchuelerFuerAufgabe(aufgabeid);
    res.json(schueler);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden der Schüler' });
  }
};

export const updateSchuelerStatus = async (req, res) => {
  try {
    const { anmeldung_id } = req.params;
    const { status } = req.body;

    // Prüfen ob der Lehrer berechtigt ist
    const anmeldung = await model.query(
      `SELECT a.*
       FROM schueler_aufgabe_anmeldung sa
       JOIN aufgabe a ON sa.aufgabeid = a.aufgabeid
       WHERE sa.anmeldung_id = $1 AND a.lehrerid = $2`,
      [anmeldung_id, req.user.lehrerid],
    );

    if (anmeldung.rows.length === 0) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const updated = await model.updateSchuelerAnmeldungStatus(anmeldung_id, status);
    res.json({ message: 'Status aktualisiert', anmeldung: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Status' });
  }
};
