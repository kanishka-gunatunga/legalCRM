import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class LiveChat extends Model {
  public id!: number;
  public message_id!: string;
  public sent_by!: string;
  public message!: string;
  public sent_to_user!: string;
  public viewed_by_agent!: string;
  public updated_at!: Date;
  public created_at!: Date;
}

LiveChat.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    message_id: {
        type: new DataTypes.STRING(),
        allowNull: false,
      },
    sent_by: {
      type: new DataTypes.STRING(),
      allowNull: false,
    },
    message: {
      type: new DataTypes.STRING(),
      allowNull: false,
    },
    sent_to_user: {
        type: new DataTypes.STRING(),
        allowNull: true,
      },
      viewed_by_agent: {
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
    tableName: 'live_agent_chat_chats',
    modelName: 'LiveChat',
  }
);

export default LiveChat;
