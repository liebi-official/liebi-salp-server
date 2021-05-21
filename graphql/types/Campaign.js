const { gql } = require("apollo-server");

const Campaign = gql`
  type CampaignInfo {
    targets: String
    votersNum: Int
  }

  type Timetable {
    invitationStartTime: Int
    invitationEndTime: Int
    salpWhitelistStartTime: Int
    salpStartTime: Int
    salpEndTime: Int
    serverTime: Int
  }

  type CoefficientList {
    straightRewardCoefficient: Float
    successfulAuctionRewardCoefficient: Float
    royaltyCoefficient: Float
  }

  type Query {
    getCampaignInfo: CampaignInfo
    getFundingProgress: String
    getTimetable: Timetable
    getCoefficients: CoefficientList
  }
`;

module.exports = Campaign;
