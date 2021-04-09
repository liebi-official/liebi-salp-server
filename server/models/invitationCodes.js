const invitationCodes = (sequelize, DataTypes) => {
  const InvitationCodes = sequelize.define("invitationCodes", {
    invitor_address: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    invitor_code: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        len: [6, 6],
        notEmpty: true,
      },
    },
  });

  return InvitationCodes;
};

export default invitationCodes;
