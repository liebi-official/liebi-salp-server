const invitations = (sequelize, DataTypes) => {
  const Invitations = sequelize.define("invitations", {
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
    invitationCode: {
      type: DataTypes.STRING,
      defaultValue: "AA0000",
      allowNull: false,
      validate: {
        len: [6, 6],
      },
    },
  });

  // 表明在Invitation表里id字段与Transactions这个表的id字段相关联
  Invitations.associate = (models) => {
    Invitations.belongsTo(models.Transactions, {
      foreignKey: "id",
      onDelete: "CASCADE",
    });
  };

  return Invitations;
};

export default invitations;
