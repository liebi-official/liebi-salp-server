const { gql } = require("apollo-server");

const Campaign = gql`
  type campaignInfo {
    targets: String
    multisigAccountCurrentBalance: String
    invitationStartTime: Int
    invitationEndTime: Int
    salpStartTime: Int
    salpEndTime: Int
    campaignStatus: String # 值可能为以下几种中的一种："bidding","successful","failed"
  }

  type Query {
    getCampaignInfo: campaignInfo
  }
`;

module.exports = Campaign;
