const { gql } = require("apollo-server");

const Contributions = gql`
  type EarlyBirdData {
    ifReserved: Boolean # 该账户是否已预约
    personalContributions: String # 用于展示vsKSM有多少
    numberOfInvitees: Int
  }

  type SuccessfulAuctionReward {
    ifReserved: Boolean # 该账户是否已预约
    personalContributions: String # 用于展示vsKSM有多少
    rewardedPersonalContributions: String # 用于计算符合条件的奖励有多少
    successfulAuctionReward: String # 符合条件的奖励
    numberOfInvitees: Int
    invitationContributions: String
    successfulAuctionRoyalty: String
    reservationReward: String
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
    getEarlyBirdData(account: String!): EarlyBirdData
    # 查询成功竞拍后获得的奖励
    successfulAuctionRewardData(account: String!): SuccessfulAuctionReward
    # 通过账号查询用户自己的邀请码
    getInvitationCodeByAccount(account: String!): InvitationCodeData
    # 通过邀请码查询用户账号
    getAccountByInvitationCode(code: String!): AccountByInvitation
    # 查询contribution明细
    getContributions(account: String!, recordNum: Int = 50): ContributionsData
    # 查询用户是否已预约，即是否在白名单内
    ifReserved(account: String!): Boolean
  }

  type Mutation {
    # 预约：进入白名单+生成邀请码
    generateInvitationCode(input: CodeGenerationInput): InvitationCodeData
  }
`;

module.exports = Contributions;
