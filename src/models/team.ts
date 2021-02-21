import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import models from './models'
import Team from '../ts/Team'

const Team = connection.collection(models.TEAM)

interface IMember {
  accountId: string
  position?: {
    title: string
    description: string
  }
}

export default {
  Create: (params: any = {}) => {
    const { name, master, members, content } = params
    
    return Team.insertOne({
      name,
      leader: new ObjectId(master),
      members: members.map((member: IMember) => {
        return {
          accountId: new ObjectId(member.accountId),
          position: {
            title: member.position?.title,
            description: member.position?.description
          }
        } 
      }),
      content,
      createdAt: new Date(),
    })
  },
}