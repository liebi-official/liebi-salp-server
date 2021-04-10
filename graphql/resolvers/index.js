import { mergeResolvers } from "merge-graphql-schemas";

import Campaign from "./Campaign";
import Contributions from "./Contributions";

const resolvers = [Campaign, Contributions];

module.exports = mergeResolvers(resolvers);
