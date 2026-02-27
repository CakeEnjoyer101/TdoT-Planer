import passport from 'passport';
import dotenv from 'dotenv';
import { Strategy as LocalStrategy } from 'passport-local';
import * as model from '../model/model.js';

dotenv.config();

passport.serializeUser((user, done) => {
  done(null, user.userid);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await model.findUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await model.findUserByEmail(email.toLowerCase());

        if (!user) {
          return done(null, false, { message: 'Falsche Email oder Passwort' });
        }

        if (!user.password_hash) {
          return done(null, false, { message: 'Bitte registriere dich zuerst' });
        }

        const isValidPassword = await model.verifyPassword(password, user.password_hash);

        if (!isValidPassword) {
          return done(null, false, { message: 'Falsche Email oder Passwort' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

export default passport;
