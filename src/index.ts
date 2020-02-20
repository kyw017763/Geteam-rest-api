import express from 'express';
import dotenv from 'dotenv';
import config from './config';
dotenv.config();

import { auth } from './routes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', auth);

app.listen(process.env.PORT || config.PORT, () => {
  
});
