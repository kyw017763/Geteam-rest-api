import express from 'express'
import { SuccessResponse, FailureResponse, InternalErrorResponse } from './../lib/responseForm'
import { INVALID_PARAM, NOT_FOUND, BAD_REQUEST } from '../lib/failureResponse';
import models from '../models'
import { validateKind, validateCategory, validateModifyOrder } from '../lib/validateValue'
import { sendTeamEmail } from 'src/lib/sendEmail'
import redisClient from '../lib/redisClient'
import IApply from 'src/ts/IApply'

const MessageDB = models.message

const router = express.Router()
export default router