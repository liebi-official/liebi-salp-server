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
        model: models.Invitations,
        include: [{ model: models.InvitationCodes }],
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
    where: { inviter_address: account },
  };

  let rs = await models.InvitationCodes.findOne(condition);

  if (!rs) {
    return {
      numberOfInvitees: 0,
      invitationContributions: new BigNumber(0),
    };
  }

  let accountCode = rs.inviter_code;

  condition = {
    where: {
      invitation_code: accountCode,
    },
    include: [
      {
        model: models.Transactions,
        required: true, // required: true使查询变成inner join,只有两个表都存在的id，才能出现在结果里
      },
    ],
    raw: true, // 获取object array
  };

  const accountInvitationList = await models.Invitations.findAll(condition);

  const invitationContributions = getSumOfAFieldFromList(
    accountInvitationList,
    "transaction.amount"
  );

  condition = {
    where: {
      invitation_code: accountCode,
    },
    attributes: ["invitee"],
    include: [
      {
        model: models.Transactions,
        attributes: [],
        required: true, // required: true使查询变成inner join,只有两个表都存在的id，才能出现在结果里
      },
    ],
    raw: true, // 获取object array
  };
  const accountInviteeList = await models.Invitations.findAll(condition);

  let uniqueInvitees = new Set();
  accountInviteeList.forEach((obj) => {
    uniqueInvitees.add(obj.invitee);
  });

  return {
    numberOfInvitees: uniqueInvitees.size,
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
        status: "ok",
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

      // fake data
      return {
        personalContributions: personalContributions.toFixed(),
        successfulAuctionReward: successfulAuctionReward.toFixed(),
        numberOfInvitees: numberOfInvitees,
        invitationContributions: invitationContributions.toFixed(),
        successfulAuctionRoyalty: successfulAuctionRoyalty.toFixed(),
        status: "ok",
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
    getContributions: async (
      parent,
      { contributorAccount, inviterAccount, recordNum },
      { models }
    ) => {
      if (!contributorAccount & !inviterAccount) {
        return {
          status: "empty_account",
        };
      }

      if (!contributorAccount) {
        // 查询下线的人头数及总contributions金额
        const rs = await getInvitationData(inviterAccount, models);

        let invitationContributionList = rs.accountInvitationList.map(
          (rawRs) => {
            return {
              contributorAddress: rawRs.invitee,
              amount: rawRs["transaction.amount"],
              timestamp: rawRs.init_timestamp,
              inviterAddress: inviterAccount,
            };
          }
        );

        if (invitationContributionList.length > recordNum) {
          invitationContributionList = invitationContributionList.slice(
            0,
            recordNum
          );
        }

        return {
          totalContributions: rs.invitationContributions.toFixed(0),
          contributions: invitationContributionList,
          status: "ok",
        };
      }

      if (!inviterAccount) {
        const rs = await getPersonalContributions(contributorAccount, models);
        let personalContributionList = rs.personalContributionList.map(
          (rawRs) => {
            return {
              contributorAddress: contributorAccount,
              amount: rawRs.amount,
              timestamp: rawRs["invitation.init_timestamp"],
              inviterAddress:
                rawRs["invitation.invitationCode.inviter_address"],
            };
          }
        );

        if (personalContributionList.length > recordNum) {
          personalContributionList = personalContributionList.slice(
            0,
            recordNum
          );
        }

        return {
          totalContributions: rs.personalContributions.toFixed(0),
          contributions: personalContributionList,
          status: "ok",
        };
      }

      // 如果两个账户都存在，则查询出两人之间一共存在多少笔邀请交易
      let condition = {
        where: { inviter_address: inviterAccount },
      };

      let rs = await models.InvitationCodes.findOne(condition);

      if (!rs) {
        return {
          totalContributions: "0",
          contributions: [],
          status: "no_invitation_code",
        };
      }

      let accountCode = rs.inviter_code;

      condition = {
        where: {
          invitation_code: accountCode,
        },
        include: [
          {
            model: models.Transactions,
            where: { from: contributorAccount },
            required: true, // required: true使查询变成inner join,只有两个表都存在的id，才能出现在结果里
          },
        ], // inner join,只有两个表都存在的id，才能出现在结果里
        raw: true, // 获取object array
      };

      const rawInvitationList = await models.Invitations.findAll(condition);

      let accountInvitationList = [];
      let invitationContributions = new BigNumber(0);

      if (rawInvitationList.length != 0) {
        accountInvitationList = rawInvitationList.map((rawRs) => {
          return {
            contributorAddress: contributorAccount,
            amount: rawRs["transaction.amount"],
            timestamp: rawRs.init_timestamp,
            inviterAddress: inviterAccount,
          };
        });

        invitationContributions = getSumOfAFieldFromList(
          accountInvitationList,
          "amount"
        );
      }

      if (accountInvitationList.length > recordNum) {
        accountInvitationList = accountInvitationList.slice(0, recordNum);
      }

      // fake data
      return {
        totalContributions: invitationContributions.toFixed(0),
        contributions: accountInvitationList,
        status: "ok",
      };
    },
  },

  // =============================================================================
  //? MUTATIONS
  // =============================================================================
  Mutation: {
    generateInvitationCode: async (parent, { account }, { models }) => {
      // 检查账户是否已有邀请码
      let record = await models.InvitationCodes.findOne({
        where: { inviter_address: account },
      });

      // status值为"new", "existing", "none"中的一种
      if (record) {
        return {
          invitationCode: record.inviter_code,
          status: "existing",
        };
      }

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

    writeContributionRecord: async (parent, { input }, { models }) => {
      const invitations = {
        transactions_id: input.transactionsId,
        amount: input.amount,
        invitee: input.invitee,
        invitation_code: input.invitationCode,
        init_timestamp: input.initTimestamp,
      };

      await models.Invitations.create(invitations);
      return "ok";
    },
  },
};

module.exports = Contributions;
