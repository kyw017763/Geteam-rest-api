import Team from '../TeamModel'
import Account from '../AccountModel'
import Member from './Member'

export interface Create {
    name: string;
    master: string;
    members: Member[];
    content: string;
}