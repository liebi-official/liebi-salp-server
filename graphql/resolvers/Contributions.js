import BigNumber from "bignumber.js";
import {
  getRandomCombination,
  campaignInfoInitialization,
  getInvitationData,
  queryIfReserved,
  queryIfAuthenticated,
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
      // 查询一下是否已生成过邀请码且已经激活过了，如果是的话，就是查询和返回。如果不是的话，就返回none.
      let record = await models.InvitationCodes.findOne({
        where: {
          $and: [
            { inviter_address: account },
            { if_authenticated: true },
            { inviter_code: { $not: null } },
          ],
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
      // 查询用户是否已预约，即是否在白名单内
      return await queryIfReserved(account, models);
    },
    ifAuthenticated: async (parent, { account }, { models }) => {
      // 查询用户是否已激活邀请码
      return await queryIfAuthenticated(account, models);
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

      let inviteRecord;
      // 如果填了邀请码
      if (invited_by_code) {
        // 判断邀请人的邀请码是否有效。无效则返回邀请人无效
        inviteRecord = await models.InvitationCodes.findOne({
          where: { inviter_code: invited_by_code },
        });

        if (!inviteRecord) {
          return {
            status: "invalid_inviter_code",
          };
        }
      }

      // 查询该账户是否在invitation_codes表里有记录
      let record = await models.InvitationCodes.findOne({
        where: { inviter_address: account },
      });

      // 再检查账户是否已经生成过邀请码且激活过
      if (record && record.inviter_code && record.if_authenticated) {
        return {
          invitationCode: record.inviter_code,
          status: "existing",
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

      // 如果原来有邀请码的，就用原来的，没有就重新生成
      let newInvitationCode = record?.inviter_code;
      if (!newInvitationCode) {
        while (true) {
          newInvitationCode = getRandomCombination();

          // 检查邀请码是否有重复
          let rs = await models.InvitationCodes.findOne({
            where: { inviter_code: newInvitationCode },
          });
          if (!rs) {
            break;
          }
        }
      }

      // 查询一下是否有抓取到预约交易，如果有的话，if_authenticated值为true,否则为false
      // 原来绑定过就更新，没绑定过就插入一条新记录
      // 原来就绑定了邀请人的话，就沿用原来的邀请人。没有的话，就用新传入的邀请人。
      const auth = await authenticateReserveTransaction(account, models);

      await models.InvitationCodes.upsert({
        inviter_address: account,
        inviter_code: newInvitationCode,
        invited_by_address:
          record?.invited_by_address || inviteRecord?.inviter_address || null,
        if_authenticated: auth,
      });

      let newRecord = await models.InvitationCodes.findOne({
        where: {
          $and: [{ inviter_address: account }, { if_authenticated: true }],
        },
      });

      if (newRecord) {
        // 已激活
        return {
          invitationCode: newRecord.inviter_code,
          status: "new",
        };
      } else {
        // 未激活，说明投票不足0.1个ksm标准
        return {
          status: "not_meet_contribution_standard",
        };
      }
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
        where: {
          $and: [
            { inviter_address: account },
            { invited_by_address: { $not: null } },
          ],
        },
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

      await models.InvitationCodes.upsert({
        inviter_address: account,
        inviter_code: record?.inviter_code || null,
        invited_by_address: inviteRecord.inviter_address,
        if_authenticated: record?.if_authenticated || false,
      });

      return {
        status: "ok",
      };
    },
  },
};

module.exports = Contributions;
