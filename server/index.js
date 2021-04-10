import { ApolloServer } from "apollo-server";
import { typeDefs, resolvers } from "../graphql";
import models, { sequelize } from "./models";

require("dotenv").config();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  tracing: true,
  introspection: true,
  playground: true,
  context: { models },
});

sequelize.sync().then(async () => {
  server.listen(4022).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
});
