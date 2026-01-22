import express from 'express';
import passport from 'passport';
import asyncHandler from 'express-async-handler';
import * as controller from '../controller/controller.js';
import * as model from '../model/model.js';
import { sendVerificationMail } from '../services/mailService.js';

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

    const existingUser = await model.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email bereits registriert' });
    }

    let lehrerId = null;
    let userKlasse = null;

    // Lehrer erkennen
    const emailParts = email.split('@')[0].split('.');
    const secondPart = emailParts[1] || '';
    const hasNumber = /\d/.test(secondPart);

    if (!hasNumber) {
      const neuerLehrer = await model.createLehrer(name, 'Allgemein');
      lehrerId = neuerLehrer.lehrerid;
      userKlasse = 'Lehrer';
    }

    // 👤 USER ERSTELLEN
    const user = await model.createUser(email, name, password, lehrerId);

    if (userKlasse === 'Lehrer') {
      await model.updateUserKlasse(user.userid, 'Lehrer');
    }

    // 📧 EMAIL VERIFIKATION
    const token = await model.setEmailVerificationToken(user.userid);
    await sendVerificationMail(user.email, token);

    // ❌ KEIN LOGIN
    return res.status(201).json({
      message: 'Registrierung erfolgreich. Bitte E-Mail bestätigen.',
    });
  })
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

    if (req.user.klasse === 'Lehrer' && req.user.lehrerid) {
      // Prüfen ob Lehrer bereits für eine Aufgabe angemeldet ist
      const bereitsAngemeldet = await model.isLehrerAlreadyRegistered(req.user.lehrerid);

      if (bereitsAngemeldet) {
        return res.status(400).json({
          error:
            'Sie sind bereits für eine Aufgabe angemeldet. Bitte melden Sie sich zuerst von der aktuellen Aufgabe ab.',
        });
      }

      const aufgabe = await model.lehrerFuerAufgabeAnmelden(req.user.lehrerid, aufgabeid);
      res.json({ message: 'Aufgabe erfolgreich übernommen', aufgabe });
    } else {
      res.status(403).json({ error: 'Nur Lehrer können Aufgaben übernehmen' });
    }
  }),
);

// Neue Route: Lehrer von Aufgabe abmelden
router.post(
  '/lehrer/abmelden',
  ensureAuth,
  asyncHandler(async (req, res) => {
    if (req.user.klasse !== 'Lehrer' || !req.user.lehrerid) {
      return res.status(403).json({ error: 'Nur Lehrer können sich abmelden' });
    }

    const result = await model.lehrerVonAufgabeAbmelden(req.user.lehrerid);
    res.json({
      message: 'Erfolgreich von der Aufgabe abgemeldet',
      aufgabe: result,
    });
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

router.get(
  '/auth/verify-email',
  asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('Token fehlt');
    }

    const user = await model.verifyEmailByToken(token);

    if (!user) {
      return res
        .status(400)
        .send('Ungültiger oder abgelaufener Bestätigungslink');
    }

    // optional: direkt auf Frontend weiterleiten
    return res.redirect('http://localhost:9000/?verified=1');
  }),
);



export default router;
