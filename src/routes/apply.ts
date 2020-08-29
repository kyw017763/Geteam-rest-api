import express from 'express'
import * as controller from '../controller/apply.controller'

const router = express.Router()
export default router

router.get('/', controller.GetMyApplyByKind)
router.get('/applied', controller.GetApplyOnMyBoard)
router.get('/accepted', controller.GetMyAcceptedApplyByKind)
router.get('/unaccpeted', controller.GetMyUnacceptedApplyByKind)
router.get('/:id', controller.GetApplyOnMyParticularBoard)

router.post('/', controller.Create)

router.patch('/:id/accept', controller.UpdateAccept)

router.delete('/:boardId/:applyId', controller.Delete)
