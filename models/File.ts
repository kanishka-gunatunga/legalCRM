import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class File extends Model {
  public id!: number;
  public user_id!: number;
  public file_id!: string;
  public updated_at!: Date;
  public created_at!: Date;
}

File.init(
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
    file_id: {
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
    tableName: 'files',
    modelName: 'File',
  }
);

export default File;
