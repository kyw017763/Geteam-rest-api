import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import models from './models'
import Team from '../ts/models/TeamModel'
import Member from '../ts/models/team/Member'
import { Create } from '../ts/models/team'

const Team = connection.collection(models.TEAM)

export default {
  Create: (params: Create) => {
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