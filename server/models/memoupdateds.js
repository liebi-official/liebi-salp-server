const memoupdateds = (sequelize, DataTypes) => {
  const Memoupdateds = sequelize.define(
    "memoupdateds",
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

  return Memoupdateds;
};

export default memoupdateds;
