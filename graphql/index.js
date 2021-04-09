// const { makeExecutableSchema } = require("graphql-tools");

const typeDefs = require("./types/");
const resolvers = require("./resolvers/");

// console.log(resolvers);

// const schema = makeExecutableSchema({
//   typeDefs,
//   resolvers
// });

module.exports = {typeDefs, resolvers};
