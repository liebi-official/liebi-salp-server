const { mergeTypes } = require("merge-graphql-schemas");

const Campaign = require("./Campaign");
const Contributions = require("./Contributions");

const typeDefs = [Campaign, Contributions];

// NOTE: 2nd param is optional, and defaults to false
// Only use if you have defined the same type multiple times in
// different files and wish to attempt merging them together.
module.exports = mergeTypes(typeDefs, { all: true });
