import bcrypt from 'bcryptjs';

export default (pwd: string) => {
  return bcrypt.hashSync(pwd, 8);
}
