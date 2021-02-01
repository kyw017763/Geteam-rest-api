import express from 'express'
import application from './application'
import auth from './auth'
import board from './board'
import count from './count'
import message from './message'

const router = express.Router()
export default router

router.use('applications', application)
router.use('auth', auth)
router.use('boards', board)
router.use('count', count)
router.use('messages', message)

module.exports = router