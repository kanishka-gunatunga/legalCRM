import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class Leads extends Model {
  public id!: number;
  public title!: string;
  public lead_value!: number;
  public description!: string;
  public category!: string;
  public person!: string;
  public email!: string;
  public phone!: string;
  public updated_at!: Date;
  public created_at!: Date;
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
    tableName: 'leads',
    modelName: 'Leads',
  }
);

export default Leads;
