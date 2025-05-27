import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class FlowTextBox extends Model {
  public id!: number;
  public node_id!: string | null;
  public title!: string | null;
  public description!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

FlowTextBox.init(
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
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
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
    modelName: 'FlowTextBox',
    tableName: 'flow_text_box',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default FlowTextBox;
