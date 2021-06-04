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
  },
};

module.exports = Extended;
