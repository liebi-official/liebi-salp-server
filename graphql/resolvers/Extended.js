import dotenv from "dotenv";
import BigNumber from "bignumber.js";
import { sequelize } from "../../server/models";
import { QueryTypes } from "sequelize";
dotenv.config();

// GraphQL查询的resolver
const Extended = {
  // ===========================================================================
  // ? QUERIES
  // ===========================================================================
  Query: {
    getExtendedInvitingReward: async (parent, { account }, { models }) => {
      // 确保Coefficients表有值
      let recordNum = await models.Coefficients.count();
      if (recordNum == 0) {
        await campaignInfoInitialization(models);
      }
      let record = await models.Coefficients.findOne();

      // 计算奖励基础
      let inviteesQueryString = `SELECT inviter_address FROM invitation_codes WHERE "invited_by_address" = '${account}'`;
      let queryString = `WHERE "para_id" = 2001 AND "account_id" IN (${inviteesQueryString})`;

      const result = await sequelize.query(
        `SELECT SUM(balance_of::bigint) FROM onchain_contributeds ${queryString} `,
        { type: QueryTypes.SELECT }
      );

      const invitationContributions = result[0].sum;

      const invitationStraightReward = new BigNumber(
        record.straight_reward_coefficient
      )
        .multipliedBy(record.royalty_coefficient)
        .multipliedBy(invitationContributions);

      const successfulAuctionRoyalty = new BigNumber(record.royalty_coefficient)
        .multipliedBy(record.successful_auction_reward_coefficient)
        .multipliedBy(invitationContributions);

      return {
        invitationContributions: invitationContributions,
        invitationStraightReward: invitationStraightReward,
        successfulAuctionRoyalty: successfulAuctionRoyalty,
      };
    },
    getExtendedSelfReward: async (parent, { account }, { models }) => {
      // 确保Coefficients表有值
      let recordNum = await models.Coefficients.count();
      if (recordNum == 0) {
        await campaignInfoInitialization(models);
      }

      let record = await models.Coefficients.findOne();

      // 计算在官网投票的personalContributions
      const queryString = `WHERE "para_id" = 2001 AND "account_id" = '${account}'`;
      const result = await sequelize.query(
        `SELECT SUM(balance_of::bigint) FROM onchain_contributeds ${queryString} `,
        { type: QueryTypes.SELECT }
      );

      let rewardedPersonalContributions = new BigNumber(0);
      if (result[0].sum) {
        rewardedPersonalContributions = new BigNumber(result[0].sum);
      }

      // 计算各种奖励
      const straightReward = new BigNumber(
        record.straight_reward_coefficient
      ).multipliedBy(rewardedPersonalContributions);

      const successfulAuctionReward = new BigNumber(
        record.successful_auction_reward_coefficient
      ).multipliedBy(rewardedPersonalContributions);

      // 如果该用户绑定了邀请人，则可获得额外的10%奖励
      let codeExtraInstantReward = new BigNumber(0);

      // 看是否在表里，在表里就是绑定过邀请码的
      const condition = {
        where: { inviter_address: account },
        raw: true, // 获取object array
      };

      const recordCount = await models.InvitationCodes.count(condition);

      if (recordCount != 0) {
        // 也是获得应得即时奖励金额的10%，与邀请人获得的邀请奖励是一样的
        codeExtraInstantReward = straightReward.multipliedBy(
          record.royalty_coefficient
        );
      }

      return {
        rewardedPersonalContributions: rewardedPersonalContributions.toFixed(0),
        straightReward: straightReward.toFixed(0),
        codeExtraInstantReward: codeExtraInstantReward.toFixed(0),
        successfulAuctionReward: successfulAuctionReward.toFixed(),
      };
    },
  },
};

module.exports = Extended;
