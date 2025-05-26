import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'mysql',
  dialectModule: require('mysql2'),
  host: '148.113.35.111',
  port: 3306,
  database: 'techvoice_legal_crm_bot',
  username: 'techvoice_user',
  password: '%Bm=410[=A$R',
  logging: console.log, // enable logging
  dialectOptions: {
    connectTimeout: 10000, // 10s timeout
  }
});

sequelize.authenticate().then(() => {
  console.log('DB connected.');
}).catch((err) => {
  console.error('DB connection error:', err);
});

export default sequelize;