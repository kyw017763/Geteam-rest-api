import express from 'express'
import * as controller from '../controller/apply.controller'
import passport from 'passport'

const router = express.Router()
export default router

router.use(passport.authenticate('jwt'))

router.get('/', controller.GetList)
router.get('/:boardid', controller.GetListOnMyParticularBoard)

router.post('/', controller.Create)

router.patch('/:applyid/accept', controller.UpdateAccept)

router.delete('/:boardid/:applyid', controller.Delete)
