const { mergeResolvers } = require("merge-graphql-schemas");

const Campaign = require("./Campaign");
const Contributions = require("./Contributions");

const resolvers = [Campaign, Contributions];

module.exports = mergeResolvers(resolvers);
