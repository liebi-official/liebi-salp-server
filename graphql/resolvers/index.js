import { mergeResolvers } from "merge-graphql-schemas";

import Campaign from "./Campaign";
import Contributions from "./Contributions";
import Extended from "./Extended";
import AggregatedChannels from "./AggregatedChannels";

const resolvers = [Campaign, Contributions, Extended, AggregatedChannels];

module.exports = mergeResolvers(resolvers);
