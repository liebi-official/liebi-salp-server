const salpOverview = (sequelize, DataTypes) => {
  const SalpOverview = sequelize.define("salpOverview", {
    // 多签账户目标筹集额
    channel_target: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    // 多签账户实时余额
    multisig_account_balance: {
      type: DataTypes.STRING,
      defaultValue: "0",
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  });

  return SalpOverview;
};

export default salpOverview;
