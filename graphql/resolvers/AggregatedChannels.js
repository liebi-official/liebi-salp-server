import dotenv from "dotenv";
import {
  calculateExtendedInvitingReward,
  calculateExtendedSelfReward,
  calculateSelfReward,
  calculateInvitingReward,
} from "../utils/Common";
dotenv.config();

// GraphQL查询的resolver
const AggregatedChannels = {
  // ===========================================================================
  // ? QUERIES
  // ===========================================================================
  Query: {
    getAggregatedInvitingReward: async (parent, { account }, { models }) => {
      const multisigInvitingReward = await calculateInvitingReward(
        account,
        models
      );
      const extendedInvitingReward = await calculateExtendedInvitingReward(
        account,
        models
      );

      console.log(
        "*******multisigInvitingReward.invitationContributions: ",
        multisigInvitingReward.invitationContributions.plus(
          extendedInvitingReward.invitationContributions
        )
      );

      return {
        invitationContributions: multisigInvitingReward.invitationContributions
          .plus(extendedInvitingReward.invitationContributions)
          .toFixed(0),
        numberOfInvitees: multisigInvitingReward.numberOfInvitees,
        bondList: multisigInvitingReward.bondList,
        invitationStraightReward: multisigInvitingReward.invitationStraightReward
          .plus(extendedInvitingReward.invitationStraightReward)
          .toFixed(0),
        successfulAuctionRoyalty: multisigInvitingReward.successfulAuctionRoyalty
          .plus(extendedInvitingReward.successfulAuctionRoyalty)
          .toFixed(0),
      };
    },
    getAggregatedSelfReward: async (parent, { account }, { models }) => {
      const multisigSelfReward = await calculateSelfReward(account, models);
      const extendedSelfReward = await calculateExtendedSelfReward(
        account,
        models
      );

      return {
        personalContributions: multisigSelfReward.personalContributions.toFixed(
          0
        ),
        rewardedPersonalContributions: multisigSelfReward.rewardedPersonalContributions
          .plus(extendedSelfReward.rewardedPersonalContributions)
          .toFixed(0),
        straightReward: multisigSelfReward.straightReward
          .plus(extendedSelfReward.straightReward)
          .toFixed(0),
        codeExtraInstantReward: multisigSelfReward.codeExtraInstantReward
          .plus(extendedSelfReward.codeExtraInstantReward)
          .toFixed(0),
        successfulAuctionReward: multisigSelfReward.successfulAuctionReward
          .plus(extendedSelfReward.successfulAuctionReward)
          .toFixed(0),
      };
    },
  },
};

module.exports = AggregatedChannels;
