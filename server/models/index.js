import Sequelize from "sequelize";
require("dotenv").config();

const Op = Sequelize.Op;

const sequelize = new Sequelize(process.env.POSTGRESQL_URI, {
  dialect: "postgres",
  operatorsAliases: {
    $not: Op.not,
    $and: Op.and,
    $or: Op.or,
    $eq: Op.eq,
    $ne: Op.ne,
    $gt: Op.gt,
    $gte: Op.gte,
    $lt: Op.lt,
    $lte: Op.lte,
    $like: Op.like,
  },
});

const models = {
  Transactions: require("./transactions").default(sequelize, Sequelize),
  InvitationCodes: require("./invitation_codes").default(sequelize, Sequelize),
  SalpOverviews: require("./salp_overviews").default(sequelize, Sequelize),
  Coefficients: require("./coefficients").default(sequelize, Sequelize),
  Memoupdateds: require("./memoupdateds").default(sequelize, Sequelize),
  Contributeds: require("./contributeds").default(sequelize, Sequelize),
  Warriors: require("./warriors").default(sequelize, Sequelize),
};

Object.keys(models).forEach((key) => {
  if ("associate" in models[key]) {
    models[key].associate(models);
  }
});

export { sequelize };
export default models;
