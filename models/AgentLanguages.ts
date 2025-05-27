import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class AgentLanguages extends Model {
  public id!: number;
  public user_id!: number;
  public language!: string;
  public updated_at!: Date;
  public created_at!: Date;
  
}

AgentLanguages.init(
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
      language: {
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
    tableName: 'agent_languages',
    modelName: 'AgentLanguages',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default AgentLanguages;
