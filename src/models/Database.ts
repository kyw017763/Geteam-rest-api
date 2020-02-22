import { disconnect, Connection, connect, Mongoose, createConnection } from 'mongoose';
import config from '../config';

class Database {
	public connection: Mongoose | null | void = null;
	private url: string;

	constructor (url: string) {
		this.url = url;
    this.connect(this.url);
  }

  get getConnection() {
    return this.connection;
  }

	async connect(url: string) {
		if (!this.connection) {
			this.connection = await connect(url, {
				useUnifiedTopology: true,
				useCreateIndex: true,
				useNewUrlParser: true,
        useFindAndModify: false,
      }).then((conn) => {
        console.log('Connected successfully to server');
        return conn;
      }).catch((err) => {
        console.log('Connected failed');
      });
    }
  }
  
	async disconnect() {
    await disconnect();
  }
}

export const db = new Database(process.env.DB_URL || config.DB_URL);

export const connection: Connection = createConnection(process.env.DB_URL || config.DB_URL, {
  useUnifiedTopology: true,
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false,
});
