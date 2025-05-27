import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class Node extends Model {
  public id!: number;
  public node_id!: string | null;
  public dragging!: string | null;
  public height!: string | null;
  public position!: object | null;
  public position_absolute!: object | null;
  public selected!: string | null;
  public type!: string | null;
  public width!: string | null;
  public extent!: string | null;
  public parent_id!: string | null;
  public intent!: string | null;
  public language!: string | null;
  public value!: string | null;
  public placeholder!: string | null;
  public label!: string | null;
  public created_at!: Date;
  public updated_at!: Date;
}
Node.init(
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
        dragging: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        height: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        position: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        position_absolute: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        selected: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        width: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        extent: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        parent_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        intent: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        language: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        value: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        placeholder: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        label: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
  },
  {
    sequelize,
    tableName: 'flow_nodes',
    modelName: 'Node',
  }
);

export default Node;
