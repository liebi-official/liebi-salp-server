import { mergeResolvers } from "merge-graphql-schemas";

import Campaign from "./Campaign";
import Contributions from "./Contributions";
import Extended from "./Extended";

const resolvers = [Campaign, Contributions, Extended];

module.exports = mergeResolvers(resolvers);
