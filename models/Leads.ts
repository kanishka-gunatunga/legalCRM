import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class Leads extends Model {
  public id!: number;
  public message_id!: string;
  public agent!: string;
  public time!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Leads.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
        type: new DataTypes.STRING(),
        allowNull: true,
      },
    lead_value: {
      type: new DataTypes.DOUBLE(),
      allowNull: true,
    },
    description: {
      type: new DataTypes.STRING(),
      allowNull: true,
    },
    category: {
      type: new DataTypes.STRING(),
      allowNull: true,
    },
    person: {
      type: new DataTypes.STRING(),
      allowNull: true,
    },
    email: {
      type: new DataTypes.STRING(),
      allowNull: true,
    },
    phone: {
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
    tableName: 'leads',
    modelName: 'Leads',
  }
);

export default Leads;
