import express from 'express'
import * as controller from '../controller/message.controller'
import passport from 'passport'

const router = express.Router()
export default router

router.use(passport.authenticate('jwt'))

router.get('/recv', controller.GetReceiveMessageList)
router.get('/send', controller.GetSendMessageList)

router.post('/', controller.Create)

router.patch('/read', controller.UpdateIsRead)

router.delete('/', controller.DeleteList)
router.delete('/:id', controller.DeleteItem)
