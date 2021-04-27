import BigNumber from "bignumber.js";
import {
  getRandomCombination,
  campaignInfoInitialization,
  getPersonalContributions,
  getInvitationData,
  queryIfReserved,
  KSM_RESERVATION_AMOUNT,
  getRewardedPersonalContributions,
  authenticateReserveTransaction,
} from "../utils/Common";

// GraphQL查询的resolver
const Contributions = {
  // ===========================================================================
  // ? QUERIES
  // ===========================================================================
  Query: {
    getEarlyBirdData: async (parent, { account }, { models }) => {
      // 判断该账户是否已预约
      const ifReserved = await queryIfReserved(account, models);

      // 查询个人的contribution，可用于展示vsKSM有多少
      const { personalContributions } = await getPersonalContributions(
        account,
        models
      );

      // 查询下线的人头数
      const { numberOfInvitees } = await getInvitationData(account, models);

      return {
        ifReserved: ifReserved,
        personalContributions: personalContributions.toFixed(0),
        numberOfInvitees: numberOfInvitees,
      };
    },
    successfulAuctionRewardData: async (parent, { account }, { models }) => {
      // 确保Coefficients表有值
      let recordNum = await models.Coefficients.count();
      if (recordNum == 0) {
        await campaignInfoInitialization(models);
      }

      let record = await models.Coefficients.findOne();

      // 判断该账户是否已锁定过预约的钱
      const ifAuth = await authenticateReserveTransaction(account, models);

      let reservationReward = new BigNumber(0);
      if (ifAuth) {
        reservationReward = new BigNumber(
          record.successful_auction_reward_coefficient
        ).multipliedBy(KSM_RESERVATION_AMOUNT);
      }
      // 查询个人的所有contribution
      const { personalContributions } = await getPersonalContributions(
        account,
        models
      );

      // 查询个人的符合奖励条件contribution，并计算相应的竞拍成功奖励
      const {
        rewardedPersonalContributions,
      } = await getRewardedPersonalContributions(account, models);

      const successfulAuctionReward = new BigNumber(
        record.successful_auction_reward_coefficient
      ).multipliedBy(rewardedPersonalContributions);

      // 查询下线的人头数及总contributions金额
      const {
        numberOfInvitees,
        invitationContributions,
      } = await getInvitationData(account, models);

      const successfulAuctionRoyalty = new BigNumber(
        record.successful_auction_royalty_coefficient
      ).multipliedBy(invitationContributions);

      // 判断用户是否预约过
      const ifReserved = await queryIfReserved(account, models);

      return {
        ifReserved: ifReserved,
        personalContributions: personalContributions.toFixed(),
        rewardedPersonalContributions: rewardedPersonalContributions.toFixed(),
        successfulAuctionReward: successfulAuctionReward.toFixed(),
        numberOfInvitees: numberOfInvitees,
        invitationContributions: invitationContributions.toFixed(),
        successfulAuctionRoyalty: successfulAuctionRoyalty.toFixed(),
        reservationReward: reservationReward.toFixed(),
      };
    },
    getInvitationCodeByAccount: async (parent, { account }, { models }) => {
      // 查询一下是否reserve了，如果是的话，就是查询和返回。如果不是的话，就返回none.
      let record = await models.InvitationCodes.findOne({
        where: {
          $and: [{ inviter_address: account }, { if_authenticated: true }],
        },
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
    getAccountByInvitationCode: async (parent, { code }, { models }) => {
      let record = await models.InvitationCodes.findOne({
        where: {
          $and: [{ inviter_code: code }, { if_authenticated: true }],
        },
      });

      if (record) {
        return {
          account: record.inviter_address,
        };
      } else {
        return {
          account: "",
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
    ifReserved: async (parent, { account }, { models }) => {
      // 查询个人的贡献值
      return await queryIfReserved(account, models);
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
          // 查询一下是否有抓取到预约交易，如果有的话，if_authenticated值为true,否则为false
          const auth = await authenticateReserveTransaction(account, models);

          await models.InvitationCodes.create({
            inviter_address: account,
            inviter_code: newInvitationCode,
            invited_by_address: record.inviter_address,
            if_authenticated: auth,
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
