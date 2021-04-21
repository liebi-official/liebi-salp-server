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

  type AccountByInvitation {
    account: String
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
    getInvitationCodeByAccount(account: String!): InvitationCodeData
    # 通过邀请码查询用户账号
    getAccountByInvitationCode(code: String!): AccountByInvitation
    # 查询contribution明细
    getContributions(account: String!, recordNum: Int = 50): ContributionsData
    # 查询用户的自己的contribution是否超过了某个金额，如果是的话，返回true，不是的话，返回false
    # 默认值为 "10000000000"，相当于0.1个ksm
    ifContributeEnough(
      account: String!
      threshold: String = "10000000000"
    ): Boolean
  }

  type Mutation {
    # 生成邀请码
    generateInvitationCode(input: CodeGenerationInput): InvitationCodeData
  }
`;

module.exports = Contributions;
