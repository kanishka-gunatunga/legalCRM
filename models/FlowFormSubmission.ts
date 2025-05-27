import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class FlowFormSubmission extends Model {
  public id!: number;
  public form_id!: string | null;
  public field_data!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

FlowFormSubmission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    form_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    field_data: {
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
    modelName: 'FlowFormSubmission',
    tableName: 'flow_form_submissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default FlowFormSubmission;
