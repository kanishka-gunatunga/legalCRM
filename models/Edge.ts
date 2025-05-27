import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class Edge extends Model {
  public id!: number;
  public edge_id!: string | null;
  public source!: string | null;
  public source_handle!: string | null;
  public target!: string | null;
  public target_handle!: string | null;
  public type!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Edge.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    edge_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    source_handle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    target: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    target_handle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
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
    modelName: 'Edge',
    tableName: 'flow_edges',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Edge;
