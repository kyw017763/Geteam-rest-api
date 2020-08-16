import express from 'express'
import passport from 'passport'
import passportConfig from './src/middleware/passport'
import cors from 'cors'
import dotenv from 'dotenv'
import config from './config'
dotenv.config()
import { auth, counting, board, apply } from './src/routes'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// TODO: passport config 고치기
app.use(passport.initialize())
passportConfig()

app.use(cors())

app.all('/*', function(req, res, next) {
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  next()
})

app.use('/', auth)
app.use('/', counting)
app.use('/', passport.authenticate('jwt', { session: true }), board)
app.use('/apply', passport.authenticate('jwt', { session: true }), apply)

app.listen(process.env.PORT || config.PORT, () => {})
