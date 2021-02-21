import Team from './Team'
import Account from './Account'
import Member from './Member'

export default interface TeamModelCreate {
    name: Team['name'];
    master: Account['_id'];
    members: Member[];
    content: Team['content'];
}