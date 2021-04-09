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
  }
`;

module.exports = Contributions;
