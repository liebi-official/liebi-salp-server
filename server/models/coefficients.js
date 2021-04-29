const coefficients = (sequelize, DataTypes) => {
  const Coefficients = sequelize.define(
    "coefficients",
    {
      straight_reward_coefficient: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      successful_auction_reward_coefficient: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      royalty_coefficient: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      underscored: true,
    }
  );

  return Coefficients;
};

export default coefficients;
