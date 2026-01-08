import * as userModel from '../model/userModel.js';
import * as aufgabenModel from '../model/aufgabeModel.js';

export const getProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Nicht eingeloggt' });
  }

  const isAdmin = await userModel.isAdmin(req.user.userid);

  res.json({
    user: req.user,
    isAdmin,
  });
};

export const getAufgaben = async (req, res) => {
  const aufgaben = await aufgabenModel.getAufgaben();
  res.json(aufgaben);
};

export const createAufgabe = async (req, res) => {
  const aufgabe = await aufgabenModel.createAufgabe(req.body);
  res.status(201).json(aufgabe);
};

export const logout = (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.sendStatus(200);
    });
  });
};
