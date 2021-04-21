const invitation_codes = (sequelize, DataTypes) => {
  const InvitationCodes = sequelize.define(
    "invitation_codes",
    {
      inviter_address: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      inviter_code: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          len: [6, 6],
          notEmpty: true,
        },
      },
    },
    {
      underscored: true,
    }
  );

  InvitationCodes.associate = (models) => {
    InvitationCodes.hasMany(models.InvitationCodes, {
      foreignKey: "invited_by_address",
      sourceKey: "inviter_address",
    });

    InvitationCodes.belongsTo(models.InvitationCodes, {
      foreignKey: "invited_by_address",
      targetKey: "inviter_address",
      as: "InvitedByCode",
    });

    InvitationCodes.hasMany(models.Transactions, {
      foreignKey: "from",
      sourceKey: "inviter_address",
      constraints: false, // 这个属性可以使transactions这个表的foreign key先于invitation_codes表的inviter_address生成
    });
  };
  return InvitationCodes;
};

export default invitation_codes;
