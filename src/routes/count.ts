import express from 'express'
import * as controller from '../controller/count.controller'

const router = express.Router()
export default router

router.get('/', controller.GetCount)
