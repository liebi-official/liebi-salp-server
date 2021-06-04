const onchain_contributeds = (sequelize, DataTypes) => {
  const OnchainContributeds = sequelize.define(
    "onchain_contributeds",
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
      accountId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paraId: {
        type: DataTypes.INTEGER,
      },
      balanceOf: {
        type: DataTypes.STRING,
      },
    },
    {
      underscored: true,
    }
  );

  return OnchainContributeds;
};

export default onchain_contributeds;
