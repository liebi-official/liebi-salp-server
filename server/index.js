const { ApolloServer } = require("apollo-server");
const { typeDefs, resolvers } = require("../graphql");
const { models, sequelize } = require("./models");

require("dotenv").config();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  tracing: true,
  introspection: true,
  playground: true,
  context: models,
});

sequelize.sync().then(async () => {
  server.listen(4022).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
});
