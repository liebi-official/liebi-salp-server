const invitationCodes = (sequelize, DataTypes) => {
  const InvitationCodes = sequelize.define(
    "invitationCodes",
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
    InvitationCodes.hasMany(models.Invitations, {
      foreignKey: "invitation_code",
      sourceKey: "inviter_code",
    });
  };

  return InvitationCodes;
};

export default invitationCodes;
