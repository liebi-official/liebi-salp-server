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
        unique: true,
        validate: {
          len: [6, 6],
          notEmpty: true,
        },
      },
      event_id: {
        type: DataTypes.INTEGER,
        unique: true,
        validate: {
          len: [6, 6],
          notEmpty: true,
        },
      },
      extrinsic_id: {
        type: DataTypes.INTEGER,
        unique: true,
        validate: {
          len: [6, 6],
          notEmpty: true,
        },
      },
      time: {
        type: DataTypes.DATE,
        unique: true,
        validate: {
          len: [6, 6],
          notEmpty: true,
        },
      },
      from: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          len: [6, 6],
          notEmpty: true,
        },
      },
      to: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          len: [6, 6],
          notEmpty: true,
        },
      },
      amount: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          len: [6, 6],
          notEmpty: true,
        },
      },
      type: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          len: [6, 6],
          notEmpty: true,
        },
      },
      created_at: {
        type: DataTypes.DATE,
        unique: true,
        validate: {
          len: [6, 6],
          notEmpty: true,
        },
      },
      updated_at: {
        type: DataTypes.DATE,
        unique: true,
        validate: {
          len: [6, 6],
          notEmpty: true,
        },
      },
    },
    {
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

  return Transactions;
};

export default transactions;
