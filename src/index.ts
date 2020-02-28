import express from 'express';
import passport from 'passport';
import passportConfig from './routes/passport';
import dotenv from 'dotenv';
import config from './config';
dotenv.config();
import cookieParser from 'cookie-parser';
import session from 'express-session';
import connectRedis from 'connect-redis';
import redisClient from './redis';

import { auth, counting, board } from './routes';

const app = express();

const RedisStore = connectRedis(session);
app.use(session({
  secret: process.env.SESSION_SECRET || config.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: 24000 * 60 * 60, // 쿠키 유효기간 24시간
  },
  store: new RedisStore({
    client: redisClient,
    host: '127.0.0.1',
    port: 6379,
    logErrors: true,
  }),
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());
passportConfig();

app.use('/', auth);
app.use('/', counting);
app.use('/board', passport.authenticate('jwt', { session: true }), board);

app.listen(process.env.PORT || config.PORT, () => {
  
});
