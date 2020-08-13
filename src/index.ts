import express from 'express'
import passport from 'passport'
import passportConfig from './middleware/passport'
import cors from 'cors'
import dotenv from 'dotenv'
import config from './config'
dotenv.config()
import cookieParser from 'cookie-parser'
import session from 'express-session'
import connectRedis from 'connect-redis'
import redisClient from './lib/redisClient'

import { auth, counting, board, apply, mypage } from './routes'

const app = express()

const RedisStore = connectRedis(session)
app.use(session({
  secret: process.env.SESSION_SECRET || config.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: 24000 * 60 * 60, // 쿠키 유효기간 24시간
  },
  store: new RedisStore({
    client: redisClient.client,
    host: '127.0.0.1',
    port: 6379,
    logErrors: true,
  }),
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use(passport.initialize())
app.use(passport.session())
passportConfig()

app.use(cors())

app.all('/*', function(req, res, next) {
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE')
  next()
})

app.use('/', auth)
app.use('/', counting)
app.use('/', passport.authenticate('jwt', { session: true }), board)
app.use('/apply', passport.authenticate('jwt', { session: true }), apply)
app.use('/me', passport.authenticate('jwt', { session: true }), mypage)

app.listen(process.env.PORT || config.PORT, () => {
  
})
