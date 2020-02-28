import express from 'express';
import passport from 'passport';
import passportConfig from './routes/passport';
import dotenv from 'dotenv';
import config from './config';
dotenv.config();

import { auth, counting, board } from './routes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(passport.session());
passportConfig();

app.use('/', auth);
app.use('/', counting);
app.use('/board', passport.authenticate('jwt', { session: false }), board);

app.listen(process.env.PORT || config.PORT, () => {
  
});
