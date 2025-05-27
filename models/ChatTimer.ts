import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class ChatTimer extends Model {
  public id!: number;
  public message_id!: string;
  public agent!: string;
  public time!: number;
  public updated_at!: Date;
  public created_at!: Date;
}

ChatTimer.init(
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
    agent: {
      type: new DataTypes.STRING(),
      allowNull: false,
    },
    time: {
      type: new DataTypes.DOUBLE(),
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
    tableName: 'live_chat_timer',
    modelName: 'ChatTimer',
  }
);

export default ChatTimer;
