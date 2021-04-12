const { gql } = require("apollo-server");

const Contributions = gql`
  type earlyBirdBonus {
    personalContributions: String
    earlyBirdBonus: String
    numberOfInvitation: Int
    invitationContributions: String
    earlyBirdInvitationBonus: String
  }

  type successfulAuctionReward {
    personalContributions: String
    successfulAuctionReward: String
    numberOfInvitation: Int
    invitationContributions: String
    successfulAuctionRoyalty: String
  }

  type invitationCodeData {
    invitationCode: String
    status: String # 值为"new", "existing", "none"
  }

  type contributionsData {
    totalContributions: String
    contributions: [contribution]
  }

  type contribution {
    contributorAddress: String
    amount: String
    timestamp: Int
    inviterAddress: String
  }

  input contributionRecord {
    transactionsId: String!
    amount: String!
    invitee: String!
    invitationCode: String! # 这个也不允许为空值。如果用户未填写，前端应传入一个默认邀请码
    initTimestamp: Int!
  }

  type Query {
    # 查询早鸟奖励相关数据
    earlyBirdData(account: String!): earlyBirdBonus
    # 查询成功竞拍后获得的奖励
    successfulAuctionRewardData(account: String!): successfulAuctionReward
    # 查询邀请码
    getInvitationCode(account: String!): invitationCodeData
    # 查询contribution明细
    getContributions(
      contributorAccount: String
      inviterAccount: String
      recordNum: Int = 50
    ): contributionsData
  }

  type Mutation {
    # 生成邀请码
    generateInvitationCode(account: String!): invitationCodeData
    # 写入前端传来的contribute信息，返回状态，状态可为以下内容中的一种, "ok", "fail"
    writeContributionRecord(input: contributionRecord): String
  }
`;

module.exports = Contributions;
