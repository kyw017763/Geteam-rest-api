import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import { BOARD } from './models'
import IBoard from '../ts/IBoard'

const Board = connection.collection(BOARD)

export default {
  IsEnableModify: async (params: any = {}) => {
    const { _id } = params
    const board = await Board.findOne({ _id: new ObjectId(_id) })
    return board.applyCnt === 0
  },
  IsEnableApply: async (params: any = {}) => {
    const { _id } = params
    const board = await Board.findOne({ _id: new ObjectId(_id) })
    return !board.isCompleted
  },
}
