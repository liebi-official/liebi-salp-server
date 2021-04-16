const { gql } = require("apollo-server");

const Campaign = gql`
  type CampaignInfo {
    targets: String
    multisigAccountHistoricalBalance: String
    invitationStartTime: Int
    invitationEndTime: Int
    salpStartTime: Int
    salpEndTime: Int
    campaignStatus: String # 值可能为以下几种中的一种："bidding","successful","failed"
  }

  type Query {
    getCampaignInfo: CampaignInfo
  }
`;

module.exports = Campaign;
