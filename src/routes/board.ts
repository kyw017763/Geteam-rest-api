import express from 'express'
import * as controller from '../controller/board.controller'
import passport from 'passport'

const router = express.Router()
export default router

router.get('/', controller.GetList)
router.get('/:kind', controller.GetListByKind)
router.get('/:kind/:category', controller.GetListByCategory)
router.get('/:id', controller.GetItem)

router.use(passport.authenticate('jwt'))

router.post('/', controller.Create)
router.post('/:id/team', controller.CreateTeam)

router.patch('/:id', controller.Update)

router.delete('/:id', controller.Delete)