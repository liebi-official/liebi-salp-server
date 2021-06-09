const { gql } = require("apollo-server");

const AggregatedChannels = gql`
  type Query {
    # 查询早鸟奖励相关数据
    getAggregatedSelfReward(account: String!): SelfReward
    # 查询成功竞拍后获得的奖励
    getAggregatedInvitingReward(account: String!): InvitingReward
  }
`;

module.exports = AggregatedChannels;
