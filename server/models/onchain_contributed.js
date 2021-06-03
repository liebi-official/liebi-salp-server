const onchain_contributed = (sequelize, DataTypes) => {
    const OnlineContributed = sequelize.define(
      "onchain_contributed",
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
  
    return OnlineContributed;
  };
  
  export default onchain_contributed;
  