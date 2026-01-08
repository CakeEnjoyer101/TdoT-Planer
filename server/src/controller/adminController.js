import * as userModel from '../model/userModel.js';
import * as aufgabeModel from '../model/aufgabeModel.js';

export const getSchueler = async (req, res) => {
  try {
    const { klasse, search } = req.query;
    const schueler = await userModel.getAllSchueler(klasse, search);
    res.json(schueler);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Schüler konnten nicht geladen werden' });
  }
};


export const getAufgabenVonSchueler = async (req, res) => {
  const userid = Number(req.params.userid);

  if (!userid) {
    return res.status(400).json({ error: 'Ungültige User ID' });
  }

  const aufgaben = await aufgabeModel.getAufgabenVonSchueler(userid);

  res.json(aufgaben);
};
