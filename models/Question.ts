import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class Question extends Model {
  public id!: number;
  public question!: string | null;
  public intent!: number | null;
  public language!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Question.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    question: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    intent: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    language: {
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
    modelName: 'Question',
    tableName: 'questions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Question;
