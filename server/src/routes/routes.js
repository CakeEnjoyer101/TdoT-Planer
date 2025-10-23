import express from 'express';
import passport from 'passport';
import asyncHandler from 'express-async-handler';
import * as controller from '../controller/controller.js';
import * as model from '../model/model.js';

const router = express.Router();

const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Unauthorized' });
};

const ensureAdmin = asyncHandler(async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
  const isAdmin = await model.isAdmin(req.user.userid);
  if (!isAdmin) return res.status(403).json({ error: 'Admin required' });
  return next();
});

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: true }),
  (req, res) => res.redirect('http://localhost:9000/'),
);

router.get('/auth/profile', ensureAuth, asyncHandler(controller.getProfile));
router.post('/auth/logout', controller.logout);

router.get('/aufgaben', ensureAuth, asyncHandler(controller.getAufgaben));
router.post('/aufgaben', ensureAuth, ensureAdmin, asyncHandler(controller.createAufgabe));

router.get('/auth/devlogin', (req, res) => {
  console.log('Dev login accessed');
  const devUser = {
    userid: 2,
    email: 'test@htlwienwest.at',
    name: 'Dev User',
  };

  req.login(devUser, (err) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).send(err);
    }
    console.log('Dev user logged in, redirecting...');
    return res.redirect('http://localhost:9000/user');
  });
});

router.get('/auth/admin-devlogin', (req, res) => {
  const adminUser = {
    userid: 1,
    email: 'admin@htlwienwest.at',
    name: 'Admin User',
  };

  req.login(adminUser, (err) => {
    if (err) {
      console.error('Admin login error:', err);
      return res.status(500).send(err);
    }
    console.log('Admin user logged in:', req.user);
    return res.redirect('http://localhost:9000/admin');
  });
});

export default router;
