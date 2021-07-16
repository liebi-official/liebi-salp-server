const { gql } = require("apollo-server");

const Campaign = gql`
  type CampaignInfo {
    targets: String
    votersNum: Int
    officialVotersNum: Int
  }

  type Timetable {
    invitationStartTime: Int
    invitationEndTime: Int
    salpWhitelistStartTime: Int
    salpStartTime: Int
    salpEndTime: Int
    serverTime: Int
  }

  type CoefficientList {
    straightRewardCoefficient: Float
    successfulAuctionRewardCoefficient: Float
    royaltyCoefficient: Float
  }

  type FundingChannels {
    totalProgress: String
    crowdloan: String
    liquidity: String
  }

  type ContributionRecord {
    address: String
    amount: String
    time: String
  }

  type accumulatedData {
    time: String
    accumulated: String
  }

  type Query {
    getCampaignInfo: CampaignInfo
    getFundingProgress: FundingChannels
    getTimetable: Timetable
    getCoefficients: CoefficientList
    getAllContributionRecord(
      offset: Int! # offset指的是第几页，从第1页开始
      recordNum: Int = 5 # 指的是每页几条记录，默认值为5
    ): [ContributionRecord]
    getAccumulatedContributionsSeries: [accumulatedData]
    getLeadingAmount: String # 获取领先后一名的KSM金额
    getCurrentRewardingPercent: Float # 获取当前的奖励档位
    getWarriors: [String] # 获取每一档的冲刺者名单
    getFrontendBase: Int # 获取英雄计划的计算基准
  }
`;

module.exports = Campaign;
