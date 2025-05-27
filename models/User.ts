import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class User extends Model {
  public id!: number;
  public email!: string;
  public password!: string;
  public user_role!: number;
  public status!: string;
  public online_status!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: new DataTypes.STRING(),
      allowNull: false,
    },
    password: {
      type: new DataTypes.STRING(),
      allowNull: false,
    },
    user_role: {
      type: new DataTypes.INTEGER(),
      allowNull: false,
    },
    status: {
      type: new DataTypes.STRING(),
      allowNull: false,
    },
    online_status: {
      type: new DataTypes.STRING(),
      allowNull: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
  }
);

export default User;
