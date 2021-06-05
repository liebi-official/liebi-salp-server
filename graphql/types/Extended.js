const { gql } = require("apollo-server");

const Extended = gql`
  type ExtendedInvitingReward {
    invitationContributions: String
    invitationStraightReward: String
    successfulAuctionRoyalty: String
  }

  type ExtendedSelfReward {
    rewardedPersonalContributions: String
    straightReward: String
    successfulAuctionReward: String
    codeExtraInstantReward: String
  }

  type Query {
    getExtendedInvitingReward(account: String!): ExtendedInvitingReward
    getExtendedSelfReward(account: String!): ExtendedSelfReward
  }
`;

module.exports = Extended;
