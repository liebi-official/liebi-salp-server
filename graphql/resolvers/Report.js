import { sequelize } from "../../server/models";
import dotenv from "dotenv";
dotenv.config();

const MULTISIG_ACCOUNT = process.env.MULTISIG_ACCOUNT; // 多签账户地址

// GraphQL查询的resolver
const Report = {
  // ===========================================================================
  // ? QUERIES
  // ===========================================================================
  Query: {
    getVotersInfo: async (parent, { account }, { models }) => {
      // 准备邀请人头数据，这里必须是有效的人头数据，即必须是if_authenticated为true的记录
      let inviteesData = await models.InvitationCodes.findAll({
        where: { if_authenticated: true },
        attributes: [
          "invited_by_address",
          [sequelize.fn("count", sequelize.col("inviter_address")), "count"],
        ],
        group: ["invited_by_address"],
        required: true, // inner join
        raw: true,
      });

      let inviteeNumObj = {};
      for (const invitee of inviteesData) {
        if (invitee.invited_by_address) {
          inviteeNumObj[invitee.invited_by_address] = invitee.count;
        }
      }

      // 准备一个表，关于每个的是哪个邀请码邀请进来的
      let byCodeData = await models.InvitationCodes.findAll({
        include: [
          {
            model: models.InvitationCodes,
            as: "InvitedByCode",
          },
        ],
        raw: true,
      });

      let byCodeObj = {};
      for (const byCodeItem of byCodeData) {
        if (byCodeItem.invited_by_address) {
          byCodeObj[byCodeItem.inviter_address] =
            byCodeItem["InvitedByCode.inviter_code"];
        }
      }

      // 再查出个人的第一笔vote时间
      let condition = {
        raw: true,
        include: [
          {
            model: models.InvitationCodes,
          },
        ],
        order: [["time", "ASC"]], // 按时间升序排列
      };

      if (account) {
        // 如果输入了账户地址，则单独查询该账户的信息
        condition["where"] = {
          $and: [{ from: account }, { to: MULTISIG_ACCOUNT }],
        };

        condition["limit"] = 1; // 单个账户的话，查询结果只要一条就可以了
      } else {
        // 如果没输入账户地址，则查询所有账户
        condition["where"] = { to: MULTISIG_ACCOUNT };
      }

      const personalContributionList = await models.Transactions.findAll(
        condition
      );

      if (personalContributionList.length == 0) {
        return [];
      }

      condition = {
        raw: true,
        include: [
          {
            model: models.InvitationCodes,
          },
        ],
        order: [["time", "ASC"]], // 按时间升序排列
      };

      let personalFirstVoteObj = {};
      let uniqueVoters = [];

      for (const record of personalContributionList) {
        if (!personalFirstVoteObj[record.from]) {
          personalFirstVoteObj[record.from] = record.time;

          let newData = {
            address: record.from,
            invitedBy: record["invitation_code.invited_by_address"],
            invitationCode: record["invitation_code.inviter_code"],
            invitedByCode: byCodeObj[record.from],
            firstVotingTime: new Date(record.time).toISOString().slice(0, 19),
            numberOfInvitees: inviteeNumObj[record.from] || 0,
          };

          uniqueVoters.push(newData);
        }
      }

      return uniqueVoters;
    },
  },
};

module.exports = Report;
