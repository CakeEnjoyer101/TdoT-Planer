import passport from 'passport';
import dotenv from 'dotenv';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
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
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email.endsWith('@htlwienwest.at')) {
          return done(null, false, { message: 'Unauthorized domain' });
        }

        const name = profile.displayName || 'User';
        const user = await model.createUser(email, name);
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

export default passport;
