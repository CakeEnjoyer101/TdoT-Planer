import express from 'express';
import passport from 'passport';
import asyncHandler from 'express-async-handler';
import * as controller from '../controller/controller.js';
import * as model from '../model/model.js';

const router = express.Router();

const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Nicht eingeloggt' });
};

const ensureAdmin = asyncHandler(async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const isAdmin = await model.isAdmin(req.user.userid);
  if (!isAdmin) return res.status(403).json({ error: 'Admin-Berechtigung benoetigt' });
  return next();
});

router.post(
  '/auth/register',
  asyncHandler(async (req, res) => {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, Name und Passwort werden benoetigt' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    if (!email.endsWith('@htlwienwest.at')) {
      return res.status(400).json({ error: 'Nur HTL Wien West Emails sind erlaubt' });
    }

    const existingUser = await model.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email bereits registriert' });
    }

    let lehrerId = null;
    let userKlasse = null;

    const emailParts = email.split('@')[0].split('.');
    const secondPart = emailParts[1] || '';
    const hasNumber = /\d/.test(secondPart);

    if (!hasNumber) {
      const neuerLehrer = await model.createLehrer(name, 'Allgemein');
      lehrerId = neuerLehrer.lehrerid;
      userKlasse = 'Lehrer';
    }

    const user = await model.createUser(email, name, password, lehrerId);

    if (userKlasse === 'Lehrer') {
      await model.updateUserKlasse(user.userid, 'Lehrer');
    }

    return res.status(201).json({
      message: 'Registrierung erfolgreich.',
    });
  }),
);

router.post(
  '/auth/login',
  (req, res, next) =>
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || 'Login fehlgeschlagen' });
      }
      return req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.json({
          message: 'Login erfolgreich',
          user: {
            userid: user.userid,
            email: user.email,
            name: user.name,
            klasse: user.klasse,
          },
        });
      });
    })(req, res, next),
);

router.get('/auth/profile', ensureAuth, asyncHandler(controller.getProfile));
router.post('/auth/logout', controller.logout);

router.get('/aufgaben', ensureAuth, asyncHandler(controller.getAufgaben));
router.post('/aufgaben', ensureAuth, ensureAdmin, asyncHandler(controller.createAufgabe));

router.get(
  '/admin/lehrer',
  ensureAuth,
  ensureAdmin,
  asyncHandler(async (req, res) => {
    const lehrerAccounts = await model.getAlleLehrerAccounts();
    return res.json(lehrerAccounts);
  }),
);

router.patch(
  '/admin/aufgaben/:id/lehrer',
  ensureAuth,
  ensureAdmin,
  asyncHandler(async (req, res) => {
    const aufgabeid = parseInt(req.params.id, 10);

    if (Number.isNaN(aufgabeid)) {
      return res.status(400).json({ error: 'Ungueltige Aufgabe' });
    }

    const aufgabe = await model.findAufgabeById(aufgabeid);
    if (!aufgabe) {
      return res.status(404).json({ error: 'Aufgabe nicht gefunden' });
    }

    const rawLehrerIds = Array.isArray(req.body.lehrerids)
      ? req.body.lehrerids
      : req.body.lehrerid === null || req.body.lehrerid === undefined
        ? []
        : [req.body.lehrerid];

    const lehrerids = Array.from(
      new Set(
        rawLehrerIds
          .map((value) => parseInt(value, 10))
          .filter((value) => Number.isInteger(value) && value > 0),
      ),
    );

    for (const lehrerid of lehrerids) {
      const lehrer = await model.findLehrerById(lehrerid);
      if (!lehrer) {
        return res.status(404).json({ error: `Lehrer ${lehrerid} nicht gefunden` });
      }
    }

    const updatedTask = await model.assignLehrerZuAufgabe(aufgabeid, lehrerids);

    return res.json({
      message: 'Lehrer-Zuweisung erfolgreich gespeichert',
      aufgabe: updatedTask,
    });
  }),
);

router.put(
  '/admin/lehrer/:lehrerid/aufgabe',
  ensureAuth,
  ensureAdmin,
  asyncHandler(async (req, res) => {
    const lehrerid = parseInt(req.params.lehrerid, 10);
    const aufgabeid =
      req.body.aufgabeid === null || req.body.aufgabeid === undefined
        ? null
        : parseInt(req.body.aufgabeid, 10);

    if (Number.isNaN(lehrerid)) {
      return res.status(400).json({ error: 'Ungueltiger Lehrer' });
    }

    const lehrer = await model.findLehrerById(lehrerid);
    if (!lehrer) {
      return res.status(404).json({ error: 'Lehrer nicht gefunden' });
    }

    if (aufgabeid !== null && Number.isNaN(aufgabeid)) {
      return res.status(400).json({ error: 'Ungueltige Aufgabe' });
    }

    if (aufgabeid !== null) {
      const aufgabe = await model.findAufgabeById(aufgabeid);
      if (!aufgabe) {
        return res.status(404).json({ error: 'Aufgabe nicht gefunden' });
      }
    }

    const aufgabe = await model.setAufgabeFuerLehrer(lehrerid, aufgabeid);
    return res.json({
      message: 'Lehrer-Aufgabe erfolgreich gespeichert',
      aufgabe,
    });
  }),
);

router.get(
  '/admin/schueler/overview',
  ensureAuth,
  ensureAdmin,
  asyncHandler(async (req, res) => {
    const overview = await model.getAdminSchuelerUebersicht();
    return res.json(overview);
  }),
);

router.put(
  '/admin/schueler/:userid/entschuldigungen',
  ensureAuth,
  ensureAdmin,
  asyncHandler(async (req, res) => {
    const userid = parseInt(req.params.userid, 10);
    const rawEventDays = Array.isArray(req.body.eventDays) ? req.body.eventDays : [];

    if (Number.isNaN(userid)) {
      return res.status(400).json({ error: 'Ungueltiger Schueler' });
    }

    const user = await model.findUserById(userid);
    if (!user) {
      return res.status(404).json({ error: 'Schueler nicht gefunden' });
    }

    if (user.klasse === 'Admin' || user.klasse === 'Lehrer') {
      return res.status(400).json({ error: 'Nur Schueler koennen entschuldigt werden' });
    }

    const eventDays = rawEventDays
      .map((eventDay) => parseInt(eventDay, 10))
      .filter((eventDay) => eventDay === 1 || eventDay === 2);

    const entschuldigteTage = await model.setSchuelerEntschuldigteTage(userid, eventDays);

    return res.json({
      message: 'Entschuldigungen erfolgreich gespeichert',
      event_days: entschuldigteTage,
    });
  }),
);

router.post(
  '/auth/update-klasse',
  ensureAuth,
  asyncHandler(async (req, res) => {
    const { klasse } = req.body;

    if (!klasse || klasse.trim() === '') {
      return res.status(400).json({ error: 'Klasse ist erforderlich' });
    }

    const updatedUser = await model.updateUserKlasse(req.user.userid, klasse.trim());

    return res.json({
      message: 'Klasse erfolgreich gespeichert',
      user: updatedUser,
    });
  }),
);

router.post(
  '/aufgaben/:id/anmelden',
  ensureAuth,
  asyncHandler(async (req, res) => {
    const aufgabeid = parseInt(req.params.id, 10);
    const { userid } = req.user;
    const eventDay = req.body.event_day ?? req.body.eventDay ?? null;

    if (Number.isNaN(aufgabeid)) {
      return res.status(400).json({ error: 'Ungueltige Aufgabe' });
    }

    if (req.user.klasse === 'Admin' || req.user.klasse === 'Lehrer') {
      return res.status(403).json({ error: 'Nur Schueler koennen sich fuer Aufgaben anmelden' });
    }

    const aufgabe = await model.findAufgabeById(aufgabeid);
    if (!aufgabe) {
      return res.status(404).json({ error: 'Aufgabe nicht gefunden' });
    }

    const anmeldungen = await model.schuelerFuerAufgabeAnmelden(userid, aufgabeid, {
      event_day: eventDay,
    });

    return res.json({
      message: 'Erfolgreich fuer Aufgabe angemeldet',
      anmeldungen,
    });
  }),
);

router.post(
  '/lehrer/abmelden',
  ensureAuth,
  asyncHandler(async (req, res) => {
    if (req.user.klasse !== 'Lehrer' || !req.user.lehrerid) {
      return res.status(403).json({ error: 'Nur Lehrer koennen sich abmelden' });
    }

    const result = await model.lehrerVonAufgabeAbmelden(req.user.lehrerid);
    return res.json({
      message: 'Erfolgreich von der Aufgabe abgemeldet',
      aufgaben: result,
    });
  }),
);

router.get(
  '/user/aufgaben',
  ensureAuth,
  asyncHandler(async (req, res) => {
    const { userid } = req.user;
    let aufgaben = [];

    if (req.user.klasse === 'Lehrer') {
      aufgaben = await model.getUebernommeneAufgabenFuerLehrer(req.user.lehrerid);
    } else if (req.user.klasse !== 'Admin') {
      aufgaben = await model.getAngemeldeteAufgabenFuerSchueler(userid);
    }

    return res.json(aufgaben);
  }),
);

router.get(
  '/user/schedule',
  ensureAuth,
  asyncHandler(async (req, res) => {
    if (req.user.klasse === 'Admin' || req.user.klasse === 'Lehrer') {
      return res.json({
        assignments: [],
        excused_days: [],
      });
    }

    const schedule = await model.getSchuelerTagesplan(req.user.userid);
    return res.json(schedule);
  }),
);

router.get(
  '/aufgaben/:aufgabeid/schueler',
  ensureAuth,
  asyncHandler(async (req, res) => {
    if (req.user.klasse !== 'Lehrer') {
      return res.status(403).json({ error: 'Nur Lehrer koennen Schueler-Listen einsehen' });
    }

    const aufgabeid = parseInt(req.params.aufgabeid, 10);
    const eventDay = req.query.event_day ?? req.query.day ?? null;

    if (Number.isNaN(aufgabeid)) {
      return res.status(400).json({ error: 'Ungueltige Aufgabe' });
    }

    const istZustaendig = await model.istLehrerFuerAufgabeZustaendig(req.user.lehrerid, aufgabeid);
    if (!istZustaendig) {
      return res.status(403).json({ error: 'Keine Berechtigung fuer diese Aufgabe' });
    }

    const schueler = await model.getAngemeldeteSchuelerFuerAufgabe(aufgabeid, eventDay);
    return res.json(schueler);
  }),
);

router.patch(
  '/anmeldungen/:anmeldung_id/anwesenheit',
  ensureAuth,
  asyncHandler(async (req, res) => {
    if (req.user.klasse !== 'Lehrer') {
      return res.status(403).json({ error: 'Nur Lehrer koennen Anwesenheit eintragen' });
    }

    const anmeldungId = parseInt(req.params.anmeldung_id, 10);
    const { anwesend } = req.body;

    if (Number.isNaN(anmeldungId)) {
      return res.status(400).json({ error: 'Ungueltige Anmeldung' });
    }

    if (typeof anwesend !== 'boolean') {
      return res.status(400).json({ error: 'Anwesenheit muss als true oder false uebergeben werden' });
    }

    const anmeldung = await model.setSchuelerAnwesenheitFuerLehrer(
      anmeldungId,
      req.user.lehrerid,
      anwesend,
    );

    if (!anmeldung) {
      return res.status(404).json({ error: 'Anmeldung nicht gefunden' });
    }

    return res.json({
      message: 'Anwesenheit erfolgreich gespeichert',
      anmeldung,
    });
  }),
);

router.delete(
  '/anmeldungen/:anmeldung_id',
  ensureAuth,
  asyncHandler(async (req, res) => {
    if (req.user.klasse !== 'Lehrer') {
      return res.status(403).json({ error: 'Nur Lehrer koennen Schueler abmelden' });
    }

    const anmeldungId = parseInt(req.params.anmeldung_id, 10);
    if (Number.isNaN(anmeldungId)) {
      return res.status(400).json({ error: 'Ungueltige Anmeldung' });
    }

    const entfernteAnmeldung = await model.removeSchuelerAnmeldungFuerLehrer(
      anmeldungId,
      req.user.lehrerid,
    );

    if (!entfernteAnmeldung) {
      return res.status(404).json({ error: 'Anmeldung nicht gefunden' });
    }

    return res.json({ message: 'Schueler erfolgreich abgemeldet', anmeldung: entfernteAnmeldung });
  }),
);

export default router;
