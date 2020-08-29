import { Request, Response } from 'express'
import { SuccessResponse, FailureResponse, InternalErrorResponse } from './../lib/responseForm'
import { INVALID_PARAM, NOT_FOUND, BAD_REQUEST } from '../lib/failureResponse';
import models from '../models'
import IMessage from 'src/ts/IMessage'

const MessageDB = models.message

export const Create = async (req: Request, res: Response) => {
    try {
        const { _id: me } = req!.session!.passport.user
        const { receiveAccount, content, originalId } = req.body

        if (!receiveAccount || !content) {
            return res.status(400).send(FailureResponse(INVALID_PARAM))
        }

        await MessageDB.Create({ receiveAccount, sendAccount: me, content, originalId })

        res.send(SuccessResponse())
    }
    catch (err) {
        console.log(err)
        res.status(500).send(InternalErrorResponse)
    }
}

export const GetReceiveMessageList = async (req: Request, res: Response) => {
    try {
        const { _id: me } = req!.session!.passport.user

        const messages = await MessageDB.GetMessageByReceiveAccount({ accountId: me })

        res.send(SuccessResponse(messages))
    }
    catch (err) {
        console.log(err)
        res.status(500).send(InternalErrorResponse)
    }
}

export const GetSendMessageList = async (req: Request, res: Response) => {
    try {
        const { _id: me } = req!.session!.passport.user

        const messages = await MessageDB.GetMessageByReceiveAccount({ accountId: me })

        res.send(SuccessResponse(messages))
    }
    catch (err) {
        console.log(err)
        res.status(500).send(InternalErrorResponse)
    }
}

export const UpdateIsReaded = async (req: Request, res: Response) => {
    try {
        const { _id: me } = req!.session!.passport.user

        const { id } = req.params

        if (!id || id.length !== 24) {
            return res.status(400).send(FailureResponse(INVALID_PARAM))
        }
        
        await MessageDB.UpdateIsReaded({ _id: id, receiveAccount: me })
        
        res.send(SuccessResponse())
    }
    catch (err) {
        console.log(err)
        res.status(500).send(InternalErrorResponse)
    }
}

export const DeleteList = async (req: Request, res: Response) => {
    try {
        const { _id: me } = req!.session!.passport.user

        const { ids } = req.query

        let isValid = true
        const messageIdList = String(ids).split('')

        messageIdList.map((id: string) => { if (!id || id.length !== 24) isValid = false })

        if (!messageIdList.length || isValid) {
            return res.status(400).send(FailureResponse(INVALID_PARAM))
        }

        await MessageDB.DeleteList({ ids: messageIdList, accountId: me })
        
        res.send(SuccessResponse())
    }
    catch (err) {
        console.log(err)
        res.status(500).send(InternalErrorResponse)
    }
}

export const DeleteItem = async (req: Request, res: Response) => {
    try {
        const { _id: me } = req!.session!.passport.user
        const { id } = req.params

        if (!id || id.length !== 24) {
            return res.status(400).send(FailureResponse(INVALID_PARAM))
        }

        await MessageDB.DeleteItem({ _id: id, accountId: me })
        
        res.send(SuccessResponse())
    }
    catch (err) {
        console.log(err)
        res.status(500).send(InternalErrorResponse)
    }
}
