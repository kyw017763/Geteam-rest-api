import { connect } from 'mongoose';
import fs from 'fs';
import { format } from 'util';
import config from '../config';

const ca = [fs.readFileSync('./../geteam.pem')];

export const connection = connect(process.env.DB_URL || config.DB_URL, {
  useUnifiedTopology: true,
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  sslValidate: true,
  sslCA:ca,
}).then((conn) => {
  console.log('Connected successfully to server');
  return conn;
}).catch((err) => {
  console.log('Connected failed');
});