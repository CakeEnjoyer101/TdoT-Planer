import express from 'express';
import passport from 'passport';
import asyncHandler from 'express-async-handler';

import {
  getProfile,
  getAufgaben,
  createAufgabe,
} from '../controller/controller.js';

import {
  getSchueler,
  getAufgabenVonSchueler,
} from '../controller/adminController.js';

import requireAdmin from '../middleware/requireAdmin.js';

const router = express.Router();

/* ========= AUTH GUARD ========= */
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Nicht eingeloggt' });
}

/* ========= AUTH ========= */

router.post('/auth/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        error: info?.message || 'Login fehlgeschlagen',
      });
    }

    req.login(user, (err) => {
      if (err) return next(err);

      res.json({
        message: 'Login erfolgreich',
        user: {
          userid: user.userid,
          email: user.email,
          name: user.name,
          klasse: user.klasse,
          lehrerid: user.lehrerid ?? null,
        },
      });
    });
  })(req, res, next);
});

router.post('/auth/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.sendStatus(200);
    });
  });
});

router.get('/auth/profile', ensureAuth, asyncHandler(getProfile));

/* ========= AUFGABEN ========= */

router.get('/aufgaben', ensureAuth, asyncHandler(getAufgaben));
router.post('/aufgaben', ensureAuth, requireAdmin, asyncHandler(createAufgabe));

/* ========= ADMIN ========= */

router.get(
  '/admin/schueler',
  ensureAuth,
  requireAdmin,
  asyncHandler(getSchueler)
);

router.get(
  '/admin/schueler/:userid/aufgaben',
  ensureAuth,
  requireAdmin,
  asyncHandler(getAufgabenVonSchueler)
);

export default router;
