import fs from "fs";
import path from "path";
import util from "util";

import v2ProdDeployment from "../addresses/prod.json";
import { getProvider } from "./connection";
// import { fetchLQTYCirculatingSupply } from "./fetchLQTYCirculatingSupply";
// import { fetchLUSDCBBAMMStats } from "./fetchLUSDCBBAMMStats";
// import { fetchLUSDTotalSupply } from "./fetchLUSDTotalSupply";
// import { fetchPrices } from "./fetchPrices";
import { fetchV2Stats } from "./v2/fetchV2Stats";

import {
  DUNE_SPV2_AVERAGE_APY_URL_MAINNET,
  DUNE_SPV2_UPFRONT_FEE_URL_MAINNET,
  // LQTY_CIRCULATING_SUPPLY_FILE,
  // LUSD_CB_BAMM_STATS_FILE,
  // LUSD_TOTAL_SUPPLY_FILE,
  // OUTPUT_DIR_V1,
  OUTPUT_DIR_V2
} from "./constants";

import dotenv from "dotenv";

dotenv.config();

const panic = <T>(message: string): T => {
  throw new Error(message);
};

const alchemyApiKey = process.env.ALCHEMY_API_KEY || undefined; // filter out empty string
const duneApiKey: string = process.env.DUNE_API_KEY || panic("missing DUNE_API_KEY");
// const transposeApiKey: string = process.env.TRANSPOSE_API_KEY || panic("missing TRANSPOSE_API_KEY");
// const coinGeckoDemoApiKey: string = process.env.COINGECKO_DEMO_KEY || panic("missing COINGECKO_DEMO_KEY");

// const lqtyCirculatingSupplyFile = path.join(OUTPUT_DIR_V1, LQTY_CIRCULATING_SUPPLY_FILE);
// const lusdTotalSupplyFile = path.join(OUTPUT_DIR_V1, LUSD_TOTAL_SUPPLY_FILE);
// const lusdCBBAMMStatsFile = path.join(OUTPUT_DIR_V1, LUSD_CB_BAMM_STATS_FILE);

const arbitrumProvider = getProvider("arbitrum", { alchemyApiKey });

interface Tree extends Record<string, string | Tree> {}

const writeTree = (parentDir: string, tree: Tree) => {
  if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir);

  for (const [k, v] of Object.entries(tree)) {
    const prefix = path.join(parentDir, k);

    if (typeof v === "string") {
      fs.writeFileSync(`${prefix}.txt`, v);
    } else {
      writeTree(prefix, v);
    }
  }
};

async function main() {
  const [
    // lqtyCirculatingSupply,
    // lusdTotalSupply,
    // lusdCBBAMMStats,
    v2ProdStats,
    // prices
  ] = await Promise.all([
    // fetchLQTYCirculatingSupply(liquity),
    // fetchLUSDTotalSupply(liquity),
    // fetchLUSDCBBAMMStats(transposeApiKey),
    fetchV2Stats({
      deployment: v2ProdDeployment,
      provider: arbitrumProvider,
      duneSpApyUrl: DUNE_SPV2_AVERAGE_APY_URL_MAINNET,
      duneSpUpfrontFeeUrl: DUNE_SPV2_UPFRONT_FEE_URL_MAINNET,
      duneApiKey
    }),
    // fetchPrices({ coinGeckoDemoApiKey })
  ]);

  const v2Stats = {
    ...v2ProdStats,
    // prices
  };

  // fs.mkdirSync(OUTPUT_DIR_V1, { recursive: true });
  // fs.writeFileSync(lqtyCirculatingSupplyFile, `${lqtyCirculatingSupply}`);
  // fs.writeFileSync(lusdTotalSupplyFile, `${lusdTotalSupply}`);
  // fs.writeFileSync(lusdCBBAMMStatsFile, JSON.stringify(lusdCBBAMMStats));

  writeTree(OUTPUT_DIR_V2, v2Stats);
  fs.writeFileSync(
    path.join(OUTPUT_DIR_V2, "arbitrum.json"),
    JSON.stringify({ ...v2ProdStats }, null, 2)
  );

  // console.log(`LQTY circulating supply: ${lqtyCirculatingSupply}`);
  // console.log(`LUSD total supply: ${lusdTotalSupply}`);
  // console.log("LUSD CB BAMM stats:", lusdCBBAMMStats);
  console.log();
  console.log("v2 stats:", util.inspect(v2Stats, { colors: true, depth: null }));
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
