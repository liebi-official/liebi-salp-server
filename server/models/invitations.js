const invitations = (sequelize, DataTypes) => {
  const Invitations = sequelize.define(
    "invitations",
    {
      // invitationId，与transactions表里的id一一对应
      transactions_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      // 本次投票金额
      amount: {
        type: DataTypes.STRING,
        defaultValue: "0",
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      invitee: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      // 邀请码，如果没有则默认为"AA0000",长度为6位
      invitation_code: {
        type: DataTypes.STRING,
        defaultValue: "AA0000",
        allowNull: false,
        validate: {
          len: [6, 6],
        },
      },
      // 投票动作发出时间的unix时间戳
      init_timestamp: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          len: [10, 10],
        },
      },
    },
    {
      underscored: true,
    }
  );

  // 表明在Invitation表里id字段与Transactions这个表的id字段相关联
  Invitations.associate = (models) => {
    Invitations.belongsTo(models.Transactions, {
      foreignKey: "transactions_id",
      targetKey: "id",
      constraints: false, // 这个属性可以使invitations这个表的foreign key先于transactions表的id生成
    });

    Invitations.belongsTo(models.InvitationCodes, {
      foreignKey: "invitation_code",
      targetKey: "inviter_code",
    });
  };

  return Invitations;
};

export default invitations;
