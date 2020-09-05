import express from 'express'
import * as controller from '../controller/message.controller'

const router = express.Router()
export default router

router.get('/messages/recv', controller.GetReceiveMessageList)
router.get('/messages/send', controller.GetSendMessageList)

router.post('/message', controller.Create)

router.patch('/message/read', controller.UpdateIsReaded)

router.delete('/messages', controller.DeleteList)
router.delete('/message/:id', controller.DeleteItem)
