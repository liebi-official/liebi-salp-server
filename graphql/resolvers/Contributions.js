import BigNumber from "bignumber.js";
import {
  getRandomCombination,
  campaignInfoInitialization,
  getSumOfAFieldFromList,
} from "../utils/Common";
import dotenv from "dotenv";
dotenv.config();

const MULTISIG_ACCOUNT = process.env.MULTISIG_ACCOUNT; // 多签账户地址

// 获取个人contributions的总额
const getPersonalContributions = async (account, models) => {
  if (!account) return;

  const condition = {
    where: { $and: [{ from: account }, { to: MULTISIG_ACCOUNT }] },
    raw: true,
    include: [
      {
        model: models.InvitationCodes,
      },
    ],
  };

  const personalContributionList = await models.Transactions.findAll(condition);

  if (personalContributionList.length == 0) {
    return new BigNumber(0);
  }

  const personalContributions = getSumOfAFieldFromList(
    personalContributionList,
    "amount"
  );

  return { personalContributions, personalContributionList };
};

// 获取某账号下线的contributions的总额
const getInvitationData = async (account, models) => {
  if (!account) return;

  let condition = {
    where: { invited_by_address: account },
    include: [
      {
        model: models.Transactions,
        right: true, // will create a right join
      },
    ],
    raw: true, // 获取object array
  };

  const accountInvitationList = await models.InvitationCodes.findAll(condition);

  let invitationContributions = new BigNumber(0);
  if (accountInvitationList.length != 0) {
    invitationContributions = getSumOfAFieldFromList(
      accountInvitationList,
      "transactions.amount"
    );
  }

  condition = {
    where: { invited_by_address: account },
    raw: true, // 获取object array
  };
  const accountInviteeList = await models.InvitationCodes.findAll(condition);
  let uniqueInvitees = accountInviteeList.length;

  return {
    numberOfInvitees: uniqueInvitees,
    invitationContributions,
    accountInvitationList,
  };
};

// GraphQL查询的resolver
const Contributions = {
  // ===========================================================================
  // ? QUERIES
  // ===========================================================================
  Query: {
    earlyBirdData: async (parent, { account }, { models }) => {
      // 确保Coefficients表有值
      let recordNum = await models.Coefficients.count();
      if (recordNum == 0) {
        await campaignInfoInitialization(models);
      }

      let record = await models.Coefficients.findOne();

      // 查询个人的contribution，并计算相应的早鸟奖励
      const { personalContributions } = await getPersonalContributions(
        account,
        models
      );
      const earlyBirdBonus = new BigNumber(
        record.early_bird_coefficient
      ).multipliedBy(personalContributions);

      // 查询下线的人头数及总contributions金额
      const {
        numberOfInvitees,
        invitationContributions,
      } = await getInvitationData(account, models);

      const earlyBirdInvitationBonus = new BigNumber(
        record.early_bird_invitation_coefficient
      ).multipliedBy(invitationContributions);

      // fake data
      return {
        personalContributions: personalContributions.toFixed(0),
        earlyBirdBonus: earlyBirdBonus.toFixed(0),
        numberOfInvitees: numberOfInvitees,
        invitationContributions: invitationContributions.toFixed(0),
        earlyBirdInvitationBonus: earlyBirdInvitationBonus.toFixed(0),
        vsTokenNumber: personalContributions.toFixed(0), // 与个人contributions金额数量一致
        vsBondNumber: personalContributions.toFixed(0), // 与个人contributions金额数量一致
      };
    },
    successfulAuctionRewardData: async (parent, { account }, { models }) => {
      // 确保Coefficients表有值
      let recordNum = await models.Coefficients.count();
      if (recordNum == 0) {
        await campaignInfoInitialization(models);
      }

      let record = await models.Coefficients.findOne();

      // 查询个人的contribution，并计算相应的竞拍成功奖励
      const { personalContributions } = await getPersonalContributions(
        account,
        models
      );
      const successfulAuctionReward = new BigNumber(
        record.successful_auction_reward_coefficient
      ).multipliedBy(personalContributions);

      // 查询下线的人头数及总contributions金额
      const {
        numberOfInvitees,
        invitationContributions,
      } = await getInvitationData(account, models);

      const successfulAuctionRoyalty = new BigNumber(
        record.successful_auction_royalty_coefficient
      ).multipliedBy(invitationContributions);

      return {
        personalContributions: personalContributions.toFixed(),
        successfulAuctionReward: successfulAuctionReward.toFixed(),
        numberOfInvitees: numberOfInvitees,
        invitationContributions: invitationContributions.toFixed(),
        successfulAuctionRoyalty: successfulAuctionRoyalty.toFixed(),
      };
    },
    getInvitationCode: async (parent, { account }, { models }) => {
      let record = await models.InvitationCodes.findOne({
        where: { inviter_address: account },
      });

      if (record) {
        return {
          invitationCode: record.inviter_code,
          status: "existing",
        };
      } else {
        return {
          invitationCode: "",
          status: "none",
        };
      }
    },
    getContributions: async (parent, { account, recordNum }, { models }) => {
      // 查询下线的人头数及总contributions金额
      const invitationResult = await getInvitationData(account, models);

      let invitationContributionList = [];
      if (invitationResult.accountInvitationList.length != 0) {
        invitationContributionList = invitationResult.accountInvitationList.map(
          (rawRs) => {
            return {
              contributorAddress: rawRs["transactions.from"],
              amount: rawRs["transactions.amount"],
              timestamp: new Date(rawRs["transactions.time"])
                .toISOString()
                .slice(0, 19),
              inviterAddress: account,
            };
          }
        );
      }

      if (invitationContributionList.length > recordNum) {
        invitationContributionList = invitationContributionList.slice(
          0,
          recordNum
        );
      }

      // 查询个人的贡献值
      const personalResult = await getPersonalContributions(account, models);

      let personalContributionList = [];
      if (personalResult.personalContributionList.length != 0) {
        personalContributionList = personalResult.personalContributionList.map(
          (rawRs) => {
            return {
              contributorAddress: account,
              amount: rawRs.amount,
              timestamp: rawRs.time,
              inviterAddress: rawRs["invitation_code.invited_by_address"],
            };
          }
        );
      }

      if (personalContributionList.length > recordNum) {
        personalContributionList = personalContributionList.slice(0, recordNum);
      }

      return {
        totalContributions: personalResult.personalContributions.toFixed(0),
        contributions: personalContributionList,
        numberOfInvitees: invitationResult.numberOfInvitees,
        totalInvitationContributions: invitationResult.invitationContributions.toFixed(
          0
        ),
        invitationContributions: invitationContributionList,
      };
    },
  },

  // =============================================================================
  //? MUTATIONS
  // =============================================================================
  Mutation: {
    generateInvitationCode: async (parent, { input }, { models }) => {
      let { account, invited_by_code } = input;

      // 查询如果没有数据，则读取.env文件，初始化salp_overview表格
      const recordNum = await models.SalpOverviews.count();
      if (recordNum == 0) {
        await campaignInfoInitialization(models);
      }

      // 检查账户是否已经生成过邀请码
      let record = await models.InvitationCodes.findOne({
        where: { inviter_address: account },
      });

      // status值为"new", "existing", "none", "invalid_inviter_code", "invalid_code_generation_time", 中的一种
      if (record) {
        return {
          invitationCode: record.inviter_code,
          status: "existing",
        };
      }

      // 再判断邀请人的邀请码是否有效。无效则返回邀请人无效
      record = await models.InvitationCodes.findOne({
        where: { inviter_code: invited_by_code },
      });

      if (!record) {
        return {
          status: "invalid_inviter_code",
        };
      }

      // 最后判断是否处于邀请码生成的活动时间内，如果不是，则返回不在有效生成时间内
      let currentTimestamp = Math.round(new Date().getTime() / 1000);

      const campaignInfo = await models.SalpOverviews.findOne();

      if (
        currentTimestamp < campaignInfo.invitation_start_time ||
        currentTimestamp > campaignInfo.invitation_end_time
      ) {
        return {
          status: "invalid_code_generation_time",
        };
      }

      // 生成邀请码
      while (true) {
        let newInvitationCode = getRandomCombination();

        // 检查邀请码是否有重复
        let rs = await models.InvitationCodes.findOne({
          where: { inviter_code: newInvitationCode },
        });

        if (!rs) {
          await models.InvitationCodes.create({
            inviter_address: account,
            inviter_code: newInvitationCode,
            invited_by_address: record.inviter_address,
          });
          break;
        }
      }

      let newRecord = await models.InvitationCodes.findOne({
        where: { inviter_address: account },
      });

      return {
        invitationCode: newRecord.inviter_code,
        status: "new",
      };
    },
  },
};

module.exports = Contributions;
