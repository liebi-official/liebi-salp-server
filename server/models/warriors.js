const warriors = (sequelize, DataTypes) => {
    const Warriors = sequelize.define(
      "warriors",
      {
        bottom: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },
        top: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },
        reward_level: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },
        winner: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        underscored: true,
      }
    );
  
    return Warriors;
  };
  
  export default warriors;
  