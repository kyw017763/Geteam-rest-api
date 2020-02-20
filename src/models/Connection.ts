import { disconnect, createConnection, Connection } from 'mongoose';
import config from '../config';

class Database {
  static connection(connection: any) {
    throw new Error("Method not implemented.");
  }
	public connection: Connection | null | void = null;
	private url: string;

	constructor(url: string) {
		this.url = url;
		this.connect(this.url);
	}

	async connect(url: string) {''
		if (!this.connection) {
			this.connection = await createConnection(url, {
				useUnifiedTopology: true,
				useCreateIndex: true,
				useNewUrlParser: true,
				useFindAndModify: false,
      }).catch((err) => {
        if (err) {
          console.log('Connected failed');
        }
      });
      console.log('Connected successfully to server');
		}
	}
	async disconnect() {
    await disconnect();
  }
}

export const database = new Database(process.env.DB_URL || config.DB_URL);

export default Database;
