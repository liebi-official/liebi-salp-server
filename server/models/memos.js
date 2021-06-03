const memos = (sequelize, DataTypes) => {
    const Memos = sequelize.define(
      "memos",
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
          memo: {
            type: DataTypes.STRING,
          },
      },
      {
        underscored: true,
      }
    );
  
    return Memos;
  };
  
  export default memos;
  