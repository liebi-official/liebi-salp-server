const contributeds = (sequelize, DataTypes) => {
  const Contributeds = sequelize.define(
    "contributeds",
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      block_height: {
        type: DataTypes.INTEGER,
      },
      time: {
        type: DataTypes.DATE,
      },
      account_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      para_id: {
        type: DataTypes.STRING,
      },
      balance_of: {
        type: DataTypes.STRING,
      },
    },
    {
      underscored: true,
    }
  );

  return Contributeds;
};

export default contributeds;
