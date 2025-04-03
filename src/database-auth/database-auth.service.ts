import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Pool } from 'pg';
import { createConnection } from 'mysql2/promise';
import { MongoClient } from 'mongodb';

@Injectable()
export class DatabaseAuthService {
  private pgPool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: Number(process.env.POSTGRES_PORT),
  });

  async createTempUser(dbType: 'postgres' | 'mysql' | 'mongo') {
    const tempUser = `temp_${randomBytes(3).toString('hex')}`;
    const tempPass = randomBytes(6).toString('hex');

    if (dbType === 'postgres') {
      await this.pgPool.query(`
        CREATE USER ${tempUser} WITH PASSWORD '${tempPass}';
        GRANT CONNECT ON DATABASE ${process.env.POSTGRES_DB} TO ${tempUser};
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${tempUser};
      `);
    }

    if (dbType === 'mysql') {
      const mysqlConn = await createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
      });
      await mysqlConn.execute(`CREATE USER '${tempUser}'@'%' IDENTIFIED BY '${tempPass}';`);
      await mysqlConn.execute(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${process.env.MYSQL_DB}.* TO '${tempUser}'@'%';`);
      await mysqlConn.end();
    }

    if (dbType === 'mongo') {
        const mongoClient = new MongoClient(process.env.MONGO_URI!);
        await mongoClient.connect();
      
        const db = mongoClient.db(process.env.MONGO_DB!);
      
        await db.command({
          createUser: tempUser,
          pwd: tempPass,
          roles: [{ role: 'readWrite', db: process.env.MONGO_DB! }],
        });
      
        await mongoClient.close();
      }
      
      const adminerUrl = `http://localhost:8080/?server=${dbType}&username=${tempUser}&db=${process.env[`${dbType.toUpperCase()}_DB`]}`;
      
      return { username: tempUser, password: tempPass, adminerUrl };
    }      

  async deleteTempUser(dbType: 'postgres' | 'mysql' | 'mongo', tempUser: string) {
    if (dbType === 'postgres') {
      await this.pgPool.query(`DROP USER IF EXISTS ${tempUser};`);
    }

    if (dbType === 'mysql') {
      const mysqlConn = await createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
      });
      await mysqlConn.execute(`DROP USER '${tempUser}'@'%';`);
      await mysqlConn.end();
    }

    if (dbType === 'mongo') {
      const mongoClient = new MongoClient(process.env.MONGO_URI!);
      await mongoClient.connect();
      const db = mongoClient.db(process.env.MONGO_DB);
      await db.removeUser(tempUser);
      await mongoClient.close();
    }
  }
}
