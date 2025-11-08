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
    const aufgabe = await model.createAufgabe(req.body);
    res.status(201).json(aufgabe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create aufgabe' });
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
