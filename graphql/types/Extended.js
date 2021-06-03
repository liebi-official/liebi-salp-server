const { gql } = require("apollo-server");

const Extended = gql`
  type ExtendedInvitingReward {
    invitationContributions: String
    invitationStraightReward: String
    successfulAuctionRoyalty: String
  }

  type Query {
    getExtendedInvitingReward(account: String!): ExtendedInvitingReward
  }
`;

module.exports = Extended;
