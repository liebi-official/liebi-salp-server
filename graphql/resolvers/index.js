import { mergeResolvers } from "merge-graphql-schemas";

import Campaign from "./Campaign";
import Contributions from "./Contributions";
import Report from "./Report";

const resolvers = [Campaign, Contributions, Report];

module.exports = mergeResolvers(resolvers);
