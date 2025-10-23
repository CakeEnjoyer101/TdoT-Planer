import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import session from 'express-session';
import passport from '../src/passport/passport.js';

import testRoute from './routes/test.js';
import routes from './routes/routes.js';

dotenv.config();

const dirname = path.resolve();

const app = express();

app.use(morgan('dev'));

app.use(
  cors({
    origin: 'http://localhost:9000',
    credentials: true,
  }),
);

app.use(express.static(path.join(dirname, '/public')));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'some secret',
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/test', testRoute);
app.use('/', routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
