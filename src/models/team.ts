import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import { TEAM } from './models'
import ITeam from '../ts/ITeam'

const Team = connection.collection(TEAM)

interface IMember {
    accountId: string
    position: string
}

export default {
    Create: (params: any = {}) => {
        const { name, master, members, content } = params
        return Team.insertOne({
            name,
            master: new ObjectId(master),
            members: members.map((elem: IMember) => {
                return {
                    accountId: new ObjectId(elem.accountId),
                    position: elem.position
                } 
            }),
            content,
            createdAt: Date.now(),
        })
    },
}