import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import models from './models'
import Team from '../ts/Team'
import Member from '../ts/Member'
import TeamModelCreate from '../ts/TeamModelCreate'

const Team = connection.collection(models.TEAM)

export default {
  Create: (params: TeamModelCreate) => {
    const { name, master, members, content } = params
    
    return Team.insertOne({
      name,
      leader: new ObjectId(master),
      members: members.map((member: Member) => {
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