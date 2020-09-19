import express from 'express'
import passport from '../middleware/passport'
import apply from './apply'
import auth from './auth'
import board from './board'
import count from './count'
import message from './message'

const router = express.Router()
export default router

router.use('/apply', passport.authenticate('jwt'), apply)
router.use('/auth', auth)
router.use('/board', board)
router.use('/count', count)
router.use('/message', passport.authenticate('jwt'), message)

// TODO: 3개 이상의 글은 작성하지 못하도록