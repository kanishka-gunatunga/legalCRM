import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class FlowButtonData extends Model {
  public id!: number;
  public node_id!: string | null;
  public text!: string | null;
  public link!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

FlowButtonData.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    node_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: 'FlowButtonData',
    tableName: 'flow_button_data',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default FlowButtonData;
