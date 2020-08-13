import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import * as models from './models'
import IBoard from '../ts/IBoard'

const Board = connection.collection(models.BOARD)

export default {
  IsEnableModify: async (params: IBoard = {}) => {
    const { _id } = params
    const board = await Board.findOne({ _id: new ObjectId(_id) })
    return board.applyCnt === 0
  },
  IsEnableApply: async (params: IBoard = {}) => {
    const { _id } = params
    const board = await Board.findOne({ _id: new ObjectId(_id) })
    return !board.isCompleted
  },
}
