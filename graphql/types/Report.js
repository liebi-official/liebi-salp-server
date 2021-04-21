const { gql } = require("apollo-server");

const Report = gql`
  type VotersInfo {
    address: String
    invitedBy: String
    invitationCode: String
    invitedByCode: String
    firstVotingTime: String
    numberOfInvitees: Int
  }

  type Query {
    getVotersInfo(account: String): [VotersInfo]
  }
`;

module.exports = Report;
