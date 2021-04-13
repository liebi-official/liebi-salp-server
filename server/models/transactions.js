const transactions = (sequelize, DataTypes) => {
  const Transactions = sequelize.define(
    "transactions",
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      block_height: {
        type: DataTypes.INTEGER,
      },
      event_id: {
        type: DataTypes.INTEGER,
      },
      extrinsic_id: {
        type: DataTypes.INTEGER,
      },
      time: {
        type: DataTypes.DATE,
      },
      from: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      to: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      amount: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.STRING,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
    },
    {
      underscored: true,

      // 创建index
      indexes: [
        {
          unique: false,
          fields: ["from"],
        },
        {
          unique: false,
          fields: ["to"],
        },
        {
          unique: false,
          fields: ["time"],
        },
        {
          unique: false,
          fields: ["from", "to"],
        },
        {
          unique: false,
          fields: ["from", "time"],
        },
        {
          unique: false,
          fields: ["to", "time"],
        },
        {
          unique: false,
          fields: ["from", "to", "time"],
        },
      ],
    }
  );

  Transactions.associate = (models) => {
    Transactions.hasOne(models.Invitations, {
      foreignKey: "transactions_id",
      sourceKey: "id",
      constraints: false, // 这个属性可以使invitations这个表的foreign key先于transactions表的id生成
    });
  };

  return Transactions;
};

export default transactions;
