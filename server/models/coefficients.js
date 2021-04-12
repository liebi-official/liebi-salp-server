const coefficients = (sequelize, DataTypes) => {
  const Coefficients = sequelize.define(
    "coefficients",
    {
      early_bird_coefficient: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      early_bird_invitation_coefficient: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      successful_auction_reward_coefficient: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      successful_auction_royalty_coefficient: {
        type: DataTypes.STRING,
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
