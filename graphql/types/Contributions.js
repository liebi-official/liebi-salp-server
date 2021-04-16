const { gql } = require("apollo-server");

const Contributions = gql`
  type EarlyBirdBonus {
    personalContributions: String
    earlyBirdBonus: String
    numberOfInvitees: Int
    invitationContributions: String
    earlyBirdInvitationBonus: String
    vsTokenNumber: String
    vsBondNumber: String
  }

  type SuccessfulAuctionReward {
    personalContributions: String
    successfulAuctionReward: String
    numberOfInvitees: Int
    invitationContributions: String
    successfulAuctionRoyalty: String
  }

  type InvitationCodeData {
    invitationCode: String
    # status值为"new", "existing", "none", "invalid_inviter_code", "invalid_code_generation_time"
    status: String
  }

  type ContributionsData {
    totalContributions: String
    contributions: [Contribution]
    numberOfInvitees: Int
    totalInvitationContributions: String
    invitationContributions: [Contribution]
  }

  type Contribution {
    contributorAddress: String
    amount: String
    timestamp: String
    inviterAddress: String
  }

  input CodeGenerationInput {
    account: String!
    invited_by_code: String!
  }

  type Query {
    # 查询早鸟奖励相关数据
    earlyBirdData(account: String!): EarlyBirdBonus
    # 查询成功竞拍后获得的奖励
    successfulAuctionRewardData(account: String!): SuccessfulAuctionReward
    # 查询邀请码
    getInvitationCode(account: String!): InvitationCodeData
    # 查询contribution明细
    getContributions(account: String!, recordNum: Int = 50): ContributionsData
  }

  type Mutation {
    # 生成邀请码
    generateInvitationCode(input: CodeGenerationInput): InvitationCodeData
  }
`;

module.exports = Contributions;
