import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/sequelize';

class QuickQuestion extends Model {
  public id!: number;
  public question!: string;
  public answer!: string;
  public created_at!: Date;
  public updated_at!: Date;
}

QuickQuestion.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    question: {
      type: new DataTypes.STRING(),
      allowNull: false,
    },
    answer: {
      type: new DataTypes.STRING(),
      allowNull: false,
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
    tableName: 'quick_questions',
    modelName: 'QuickQuestion',
  }
);

export default QuickQuestion;
