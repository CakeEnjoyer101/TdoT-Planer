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
  if (!isAdmin) return res.status(403).json({ error: 'Admin-Berechtigung benötigt' });
  return next();
});

router.post(
  '/auth/register',
  asyncHandler(async (req, res) => {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, Name und Passwort werden benötigt' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    if (!email.endsWith('@htlwienwest.at')) {
      return res.status(400).json({ error: 'Nur HTL Wien West Emails sind erlaubt' });
    }

    const isAdminAccount =
      email.toLowerCase() === 'admin@htlwienwest.at' && password === 'Admin123!';

    if (isAdminAccount) {
      console.log('🔐 ADMIN ACCOUNT REGISTRATION DETECTED');
    } else {
      if (email.toLowerCase() === 'admin@htlwienwest.at') {
        return res.status(400).json({ error: 'Diese Email kann nicht registriert werden' });
      }

      const schuelerEmailRegex = /^[a-z]+\.[a-z][0-9]{2}@htlwienwest\.at$/;
      const lehrerEmailRegex = /^[a-z]+\.[a-z]+@htlwienwest\.at$/;

      if (
        !schuelerEmailRegex.test(email.toLowerCase()) &&
        !lehrerEmailRegex.test(email.toLowerCase())
      ) {
        return res.status(400).json({
          error:
            'Ungültiges Email-Format. Erwartet: nachname.buchstabezahl@htlwienwest.at (Schüler) oder nachname.vorname@htlwienwest.at (Lehrer)',
        });
      }
    }

    const existingUser = await model.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email bereits registriert' });
    }

    let lehrerId = null;
    if (!isAdminAccount) {
      const lehrerEmailRegex = /^[a-z]+\.[a-z]+@htlwienwest\.at$/;
      const isLehrer = lehrerEmailRegex.test(email.toLowerCase());

      if (isLehrer) {
        const neuerLehrer = await model.createLehrer(name, 'Allgemein');
        lehrerId = neuerLehrer.lehrerid;
        console.log(`🎯 Neuer Lehrer erstellt: ${name} mit ID ${lehrerId}`);
      }
    }

    const user = await model.createUser(email, name, password, lehrerId);

    if (isAdminAccount) {
      console.log('🎯 Setting user as admin:', user.email);
      await model.updateUserKlasse(user.userid, 'Admin');
      await model.query('INSERT INTO admin (userid, role) VALUES ($1, $2)', [
        user.userid,
        'Super Admin',
      ]);
    } else {
      const lehrerEmailRegex = /^[a-z]+\.[a-z]+@htlwienwest\.at$/;
      const isLehrer = lehrerEmailRegex.test(email.toLowerCase());

      if (isLehrer) {
        await model.updateUserKlasse(user.userid, 'Lehrer');
      }
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Login nach Registrierung fehlgeschlagen' });
      }
      return res.status(201).json({
        message: 'Registrierung erfolgreich',
        user: {
          userid: user.userid,
          email: user.email,
          name: user.name,
          klasse: isAdminAccount ? 'Admin' : user.klasse || null,
          lehrerid: user.lehrerid,
        },
      });
    });
  }),
);

router.post('/auth/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ error: info?.message || 'Login fehlgeschlagen' });
    }
    req.login(user, (err) => {
      if (err) {
        return next(err);
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
  })(req, res, next);
});

router.get('/auth/profile', ensureAuth, asyncHandler(controller.getProfile));

router.post('/auth/logout', controller.logout);

router.get('/aufgaben', ensureAuth, asyncHandler(controller.getAufgaben));
router.post('/aufgaben', ensureAuth, ensureAdmin, asyncHandler(controller.createAufgabe));

router.post(
  '/auth/update-klasse',
  ensureAuth,
  asyncHandler(async (req, res) => {
    const { klasse } = req.body;

    if (!klasse || klasse.trim() === '') {
      return res.status(400).json({ error: 'Klasse ist erforderlich' });
    }

    const updatedUser = await model.updateUserKlasse(req.user.userid, klasse.trim());

    res.json({
      message: 'Klasse erfolgreich gespeichert',
      user: updatedUser,
    });
  }),
);

router.post(
  '/aufgaben/:id/anmelden',
  ensureAuth,
  asyncHandler(async (req, res) => {
    const aufgabeid = parseInt(req.params.id);
    const userid = req.user.userid;

    if (req.user.klasse && req.user.klasse !== 'Admin' && req.user.klasse !== 'Lehrer') {
      const anmeldung = await model.schuelerFuerAufgabeAnmelden(userid, aufgabeid);
      res.json({ message: 'Erfolgreich für Aufgabe angemeldet', anmeldung });
    } else {
      res.status(403).json({ error: 'Nur Schüler können sich für Aufgaben anmelden' });
    }
  }),
);

router.post(
  '/aufgaben/:id/lehrer-anmelden',
  ensureAuth,
  asyncHandler(async (req, res) => {
    const aufgabeid = parseInt(req.params.id);
    const userid = req.user.userid;

    if (req.user.klasse === 'Lehrer' && req.user.lehrerid) {
      const aufgabe = await model.lehrerFuerAufgabeAnmelden(req.user.lehrerid, aufgabeid);
      res.json({ message: 'Aufgabe erfolgreich übernommen', aufgabe });
    } else {
      res.status(403).json({ error: 'Nur Lehrer können Aufgaben übernehmen' });
    }
  }),
);

router.get(
  '/user/aufgaben',
  ensureAuth,
  asyncHandler(async (req, res) => {
    const userid = req.user.userid;
    let aufgaben = [];

    if (req.user.klasse === 'Lehrer') {
      aufgaben = await model.getUebernommeneAufgabenFuerLehrer(req.user.lehrerid);
    } else if (req.user.klasse && req.user.klasse !== 'Admin') {
      aufgaben = await model.getAngemeldeteAufgabenFuerSchueler(userid);
    }

    res.json(aufgaben);
  }),
);

router.get(
  '/aufgaben/:aufgabeid/schueler',
  ensureAuth,
  asyncHandler(async (req, res) => {
    if (req.user.klasse !== 'Lehrer') {
      return res.status(403).json({ error: 'Nur Lehrer können Schüler-Listen einsehen' });
    }

    const aufgabeid = parseInt(req.params.aufgabeid);
    const schueler = await model.getAngemeldeteSchuelerFuerAufgabe(aufgabeid);
    res.json(schueler);
  }),
);

router.patch(
  '/anmeldungen/:anmeldung_id/status',
  ensureAuth,
  asyncHandler(async (req, res) => {
    if (req.user.klasse !== 'Lehrer') {
      return res.status(403).json({ error: 'Nur Lehrer können Status ändern' });
    }

    const { status } = req.body;
    const updated = await model.updateSchuelerAnmeldungStatus(req.params.anmeldung_id, status);
    res.json({ message: 'Status aktualisiert', anmeldung: updated });
  }),
);

export default router;
