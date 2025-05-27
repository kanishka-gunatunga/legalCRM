import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class FlowTextOnly extends Model {
  public id!: number;
  public node_id!: string | null;
  public text!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

FlowTextOnly.init(
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
    modelName: 'FlowTextOnly',
    tableName: 'flow_text_only',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default FlowTextOnly;
