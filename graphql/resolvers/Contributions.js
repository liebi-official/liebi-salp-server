import BigNumber from "bignumber.js";
import {
  getRandomCombination,
  campaignInfoInitialization,
  getInvitationData,
  queryIfReserved,
  authenticateReserveTransaction,
  calculateSelfReward,
  calculateInvitingReward,
} from "../utils/Common";

// GraphQL查询的resolver
const Contributions = {
  // ===========================================================================
  // ? QUERIES
  // ===========================================================================
  Query: {
    getSelfReward: async (parent, { account }, { models }) => {
      const result = await calculateSelfReward(account, models);
      return {
        personalContributions: result.personalContributions.toFixed(0),
        rewardedPersonalContributions: result.rewardedPersonalContributions.toFixed(
          0
        ),
        straightReward: result.straightReward.toFixed(0),
        codeExtraInstantReward: result.codeExtraInstantReward.toFixed(0),
        successfulAuctionReward: result.successfulAuctionReward.toFixed(),
      };
    },
    getInvitingReward: async (parent, { account }, { models }) => {
      const result = await calculateInvitingReward(account, models);

      return {
        invitationContributions: result.invitationContributions.toFixed(),
        numberOfInvitees: result.numberOfInvitees,
        bondList: result.bondList,
        invitationStraightReward: result.invitationStraightReward.toFixed(0),
        successfulAuctionRoyalty: result.successfulAuctionRoyalty.toFixed(),
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
    getInvitationContributionDetails: async (
      parent,
      { account, recordNum },
      { models }
    ) => {
      // 查询如果没有数据，则读取.env文件，初始化salp_overview表格
      const num = await models.SalpOverviews.count();
      if (num == 0) {
        await campaignInfoInitialization(models);
      }
      // 查询下线的人头数及总contributions金额
      const invitationResult = await getInvitationData(account, models);

      let invitationContributionList = [];
      if (invitationResult.accountInvitationList.length != 0) {
        invitationContributionList = invitationResult.accountInvitationList.map(
          (rawRs) => {
            return {
              contributorAddress: rawRs["from"],
              amount: rawRs["amount"],
              timestamp: rawRs["time"],
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

      return {
        invitationContributionDetails: invitationContributionList,
      };
    },
    ifReserved: async (parent, { account }, { models }) => {
      // 查询个人的贡献值
      return await queryIfReserved(account, models);
    },
    ifBind: async (parent, { account }, { models }) => {
      // 查询该账户是否有邀请人，有的话返回true，没有的话，返回false
      let condition = { where: { inviter_address: account } };
      const rs = await models.InvitationCodes.findOne(condition);

      if (rs) {
        // 如果有值，说明是有绑定请人的，有表里有记录
        if (rs.invited_by_address) {
          condition = { where: { inviter_address: rs.invited_by_address } };
          const inviterInfo = await models.InvitationCodes.findOne(condition);

          return {
            invitationCode: inviterInfo.inviter_code,
            status: "existing",
          };
        } else {
          return {
            invitationCode: null,
            status: "source",
          };
        }
      } else {
        return {
          invitationCode: null,
          status: "none",
        };
      }
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

      // 判断邀请人的邀请码是否有效。无效则返回邀请人无效
      let inviteRecord = await models.InvitationCodes.findOne({
        where: { inviter_code: invited_by_code },
      });

      if (!inviteRecord) {
        return {
          status: "invalid_inviter_code",
        };
      }

      // 再检查账户是否已经生成过邀请码
      let record = await models.InvitationCodes.findOne({
        where: { inviter_address: account },
      });

      // status值为"new", "existing", "none", "invalid_inviter_code", "inviter_code_different_from_previous","invalid_code_generation_time", 中的一种
      if (record) {
        if (record.inviter_code) {
          return {
            invitationCode: record.inviter_code,
            status: "existing",
          };
        } else {
          // 说明先绑定了，但没成生成邀请码
          if (inviteRecord.inviter_code != invited_by_code) {
            // 原来绑定用的邀请人代码跟现在传入的不一样
            return {
              status: "inviter_code_different_from_previous",
            };
          }
        }
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
          // 原来绑定过就更新，没绑定过就插入一条新记录
          const auth = await authenticateReserveTransaction(account, models);

          await models.InvitationCodes.upsert({
            inviter_address: account,
            inviter_code: newInvitationCode,
            invited_by_address: inviteRecord.inviter_address,
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
    bindInviter: async (parent, { input }, { models }) => {
      let { account, invited_by_code } = input;

      // 查询如果没有数据，则读取.env文件，初始化salp_overview表格
      const recordNum = await models.SalpOverviews.count();
      if (recordNum == 0) {
        await campaignInfoInitialization(models);
      }

      // 检查账户是否有绑定过邀请码，如果已绑定，刚返回错误
      let record = await models.InvitationCodes.findOne({
        where: { inviter_address: account },
      });

      // status值为"ok", "exist", "none", "invalid_inviter_code", 中的一种
      if (record) {
        return {
          status: "exist",
        };
      }

      // 判断邀请人的邀请码是否有效。无效则返回邀请人无效
      let inviteRecord = await models.InvitationCodes.findOne({
        where: { inviter_code: invited_by_code.toUpperCase() },
      });

      if (!inviteRecord) {
        return {
          status: "invalid_inviter_code",
        };
      }

      await models.InvitationCodes.create({
        inviter_address: account,
        inviter_code: null,
        invited_by_address: inviteRecord.inviter_address,
        if_authenticated: false,
      });

      return {
        status: "ok",
      };
    },
  },
};

module.exports = Contributions;
