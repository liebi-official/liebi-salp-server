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
  };

  const personalContributionList = await models.Transactions.findAll(condition);

  if (personalContributionList.length == 0) {
    return new BigNumber(0);
  }

  const personalContributions = getSumOfAFieldFromList(
    personalContributionList,
    "amount"
  );

  return personalContributions;
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
    "amount"
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
      const personalContributions = await getPersonalContributions(
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
      const personalContributions = await getPersonalContributions(
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
      // let condition = {
      //   where: { inviter_address: account },
      // };

      // let accountCode = (await models.InvitationCodes.findOne(condition))
      //   .inviter_code;

      // condition = {
      //   where: {
      //     invitation_code: accountCode,
      //   },
      //   include: Transactions, // inner join,只有两个表都存在的id，才能出现在结果里
      //   raw: true, // 获取object array
      // };

      // const accountInvitationList = await models.Invitations.findAll(
      //   condition
      // ).map(el.get({ plain: true }));

      // const invitationContributions = getSumOfAFieldFromList(
      //   accountInvitationList,
      //   "amount"
      // );

      // let inviteeList = await models.Invitations.findAll(condition).map(
      //   el.get({ plain: true })
      // );

      // fake data
      return {
        totalContributions: "5555555",
        contributions: [
          {
            contributorAddress: "aaaaaaaaa",
            amount: "4444444",
            timestamp: 1617793345,
            inviterAddress: "bbbbbbbb",
          },
          {
            contributorAddress: "bbbbbbbb",
            amount: "1111111",
            timestamp: 1617793388,
            inviterAddress: "cccccccc",
          },
        ],
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
