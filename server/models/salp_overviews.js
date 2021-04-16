const salp_overviews = (sequelize, DataTypes) => {
  const SalpOverviews = sequelize.define(
    "salp_overviews",
    {
      // 多签账户目标筹集额
      channel_target: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      // 多签账户历史总额
      multisig_account_historical_balance: {
        type: DataTypes.STRING,
        defaultValue: "0",
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      // 邀请码生成开始时间
      invitation_start_time: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          len: [10, 10],
        },
      },
      // 邀请码生成结束时间
      invitation_end_time: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          len: [10, 10],
        },
      },
      // 投票开始时间
      salp_start_time: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          len: [10, 10],
        },
      },
      // 投票结束时间
      salp_end_time: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          len: [10, 10],
        },
      },
      // 活动进行状态
      campaign_status: {
        type: DataTypes.STRING,
        defaultValue: "bidding",
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      underscored: true,
    }
  );

  return SalpOverviews;
};

export default salp_overviews;
