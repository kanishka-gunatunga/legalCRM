import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class Admin extends Model {
  public id!: number;
  public user_id!: number;
  public name!: string;
  public phone!: string;
  public status!: string;
  public updated_at!: Date;
  public created_at!: Date;
}

Admin.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: new DataTypes.INTEGER(),
      allowNull: false,
    },
    name: {
      type: new DataTypes.STRING(),
      allowNull: false,
    },
    phone: {
      type: new DataTypes.STRING(),
      allowNull: false,
    },
    status: {
      type: new DataTypes.STRING(),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
  },
  {
    sequelize,
    tableName: 'other_admin_details',
    modelName: 'Admin',
  }
);

export default Admin;
