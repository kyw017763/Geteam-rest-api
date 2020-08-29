import express from 'express'
import passport from 'passport'
import * as controller from '../controller/board.controller'

const router = express.Router()
export default router

router.get('/boards', controller.GetList)
router.get('/boards/:kind', controller.GetListByKind)
router.get('/boards/:kind/:category', controller.GetListByCategory)
router.get('/board/:id', controller.GetItem)

router.use(passport.authenticate('jwt'))

router.get('/boards/me', controller.GetListByMe) // in my page

router.post('/board/:kind/:category', controller.Create)
router.post('/:id/team', controller.CreateTeam)

router.patch('/board/:id', controller.Update)

router.delete('/board/:id', controller.Delete)