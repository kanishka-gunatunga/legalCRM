import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class ChatHeader extends Model {
  public id!: number;
  public message_id!: string;
  public agent!: string;
  public language!: string;
  public rating!: string;
  public feedback!: string;
  public status!: string;
  public is_time_out!: string;
  public updated_at!: Date;
  public created_at!: Date;
}

ChatHeader.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    message_id: {
        type: new DataTypes.STRING(),
        allowNull: true,
      },
    agent: {
      type: new DataTypes.STRING(),
      allowNull: true,
    },
    language: {
      type: new DataTypes.STRING(),
      allowNull: true,
    },
    rating: {
        type: new DataTypes.STRING(),
        allowNull: true,
      },
    feedback: {
        type: new DataTypes.STRING(),
        allowNull: true,
      },
    status: {
        type: new DataTypes.STRING(),
        allowNull: true,
      },
      is_time_out: {
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
    tableName: 'live_agent_chat_header',
    modelName: 'ChatHeader',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default ChatHeader;
