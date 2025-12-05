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

    console.log('📝 Registrierungsversuch:', { email, name });

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

      // Vereinfachte Email-Validierung
      const emailParts = email.split('@')[0];
      if (!emailParts.includes('.')) {
        return res.status(400).json({
          error:
            'Ungültiges Email-Format. Erwartet: nachname.vorname@htlwienwest.at (Lehrer) oder nachname.buchstabezahl@htlwienwest.at (Schüler)',
        });
      }
    }

    const existingUser = await model.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email bereits registriert' });
    }

    let lehrerId = null;
    let userKlasse = null;

    if (!isAdminAccount) {
      // Prüfe ob es ein Lehrer oder Schüler ist
      const emailParts = email.split('@')[0].split('.');
      const secondPart = emailParts[1] || '';

      // Wenn der zweite Teil eine Zahl enthält (z.B. a01), ist es ein Schüler
      const hasNumber = /\d/.test(secondPart);

      if (!hasNumber) {
        // Es ist ein Lehrer - erstelle Lehrer-Eintrag
        try {
          const neuerLehrer = await model.createLehrer(name, 'Allgemein');
          lehrerId = neuerLehrer.lehrerid;
          userKlasse = 'Lehrer';
          console.log(`🎯 Neuer Lehrer erstellt: ${name} mit ID ${lehrerId}`);
        } catch (err) {
          console.error('Fehler beim Erstellen des Lehrers:', err);
          // Falls Lehrer-Erstellung fehlschlägt, trotzdem Benutzer erstellen
          userKlasse = 'Lehrer';
        }
      }
      // Schüler bekommen ihre Klasse später beim Login/Update
    }

    try {
      // Erstelle den Benutzer mit der passenden Klasse
      const user = await model.createUser(email, name, password, lehrerId);

      if (isAdminAccount) {
        console.log('🎯 Setting user as admin:', user.email);
        await model.updateUserKlasse(user.userid, 'Admin');
        await model.query('INSERT INTO admin (userid, role) VALUES ($1, $2)', [
          user.userid,
          'Super Admin',
        ]);
      } else if (userKlasse === 'Lehrer') {
        await model.updateUserKlasse(user.userid, 'Lehrer');
      }
      // Schüler bekommen ihre Klasse später

      req.login(user, (err) => {
        if (err) {
          console.error('Login-Fehler nach Registrierung:', err);
          return res.status(500).json({ error: 'Login nach Registrierung fehlgeschlagen' });
        }
        return res.status(201).json({
          message: 'Registrierung erfolgreich',
          user: {
            userid: user.userid,
            email: user.email,
            name: user.name,
            klasse: isAdminAccount ? 'Admin' : userKlasse || null,
            lehrerid: lehrerId,
          },
        });
      });
    } catch (err) {
      console.error('Fehler bei der Registrierung:', err);
      res.status(500).json({ error: 'Registrierung fehlgeschlagen' });
    }
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

export default router;
