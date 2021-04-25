const { gql } = require("apollo-server");

const Campaign = gql`
  type Progress {
    targets: String
    multisigAccountHistoricalBalance: String
  }

  type Timetable {
    invitationStartTime: Int
    invitationEndTime: Int
    salpWhitelistStartTime: Int
    salpStartTime: Int
    salpEndTime: Int
    serverTime: Int
  }

  type Query {
    getCampaignProgress: Progress
    getTimetable: Timetable
  }
`;

module.exports = Campaign;
