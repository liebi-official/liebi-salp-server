const { gql } = require("apollo-server");

const Contributions = gql`
  type EarlyBirdData {
    ifReserved: Boolean # 该账户是否已预约
    personalContributions: String # 用于展示vsKSM有多少
    bondList: [InviteeInfo] # 邀请者列表
    numberOfInvitees: Int # 邀请的地址数
    straightReward: String # 本人投票直接获得的奖励，无论是否竞拍成功
    invitationStraightReward: String # 邀请获得的奖励，无论是否竞拍成功
    codeExtraInstantReward: String # 因为绑定过邀请人而获得的即时的额外奖励
  }

  type InviteeInfo {
    bondAddress: String
    bondTime: String
  }

  type SuccessfulAuctionReward {
    ifReserved: Boolean # 该账户是否已预约
    personalContributions: String # 用于展示vsKSM有多少
    rewardedPersonalContributions: String # 用于计算符合条件的奖励有多少
    successfulAuctionReward: String # 符合条件的奖励
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
    invitationContributionDetails: [Contribution]
  }

  type Contribution {
    contributorAddress: String
    amount: String
    timestamp: String
    inviterAddress: String
  }

  type BidingStatus {
    status: String # 有三种状态：ok, exist, invalid_inviter_code
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
    getInvitationContributionDetails(
      account: String!
      recordNum: Int = 50
    ): ContributionsData
    # 查询用户是否已预约，即是否在白名单内
    ifReserved(account: String!): Boolean
  }

  type Mutation {
    # 预约：进入白名单+生成邀请码
    generateInvitationCode(input: CodeGenerationInput): InvitationCodeData
    bindInviter(input: CodeGenerationInput): BidingStatus
  }
`;

module.exports = Contributions;
