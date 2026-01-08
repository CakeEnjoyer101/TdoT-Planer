import * as userModel from '../model/userModel.js';

export default async function requireAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Nicht eingeloggt' });
  }

  const isAdmin = await userModel.isAdmin(req.user.userid);

  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
  }

  next();
}
