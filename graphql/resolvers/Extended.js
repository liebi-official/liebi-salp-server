import dotenv from "dotenv";
import {
  calculateExtendedInvitingReward,
  calculateExtendedSelfReward,
} from "../utils/Common";
dotenv.config();

// GraphQL查询的resolver
const Extended = {
  // ===========================================================================
  // ? QUERIES
  // ===========================================================================
  Query: {
    getExtendedInvitingReward: async (parent, { account }, { models }) => {
      const result = await calculateExtendedInvitingReward(account, models);

      return {
        invitationContributions: result.invitationContributions.toFixed(0),
        invitationStraightReward: result.invitationStraightReward.toFixed(0),
        successfulAuctionRoyalty: result.successfulAuctionRoyalty.toFixed(0),
      };
    },
    getExtendedSelfReward: async (parent, { account }, { models }) => {
      const result = await calculateExtendedSelfReward(account, models);

      return {
        rewardedPersonalContributions: result.rewardedPersonalContributions.toFixed(
          0
        ),
        straightReward: result.straightReward.toFixed(0),
        codeExtraInstantReward: result.codeExtraInstantReward.toFixed(0),
        successfulAuctionReward: result.successfulAuctionReward.toFixed(),
      };
    },
  },
};

module.exports = Extended;
