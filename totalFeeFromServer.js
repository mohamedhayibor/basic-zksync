const ethers = require("ethers");
const zksync = require("zksync");

require("dotenv").config();

async function main() {
  console.log("==== [Started] ====");

  // To interact with Sync network users need to know the endpoint to the operator node
  const syncProvider = await zksync.getDefaultProvider("rinkeby");

  // ethers to interact with Ethereum
  const ethersProvider = new ethers.getDefaultProvider("rinkeby");

  // create ethereum wallet using ethers
  const ethWallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY).connect(ethersProvider);

  // Derive zksync.Signer from ethereum wallet
  const syncWallet = await zksync.Wallet.fromEthSigner(ethWallet, syncProvider);

  let txFeeFromServer = await syncProvider.getTransactionFee("Transfer", syncWallet.address(), "ETH");

  console.log(">> ", txFeeFromServer);

  let totalFee = txFeeFromServer.totalFee.toString();
  console.log(">> TotalFee from server: ", totalFee);
}

main()
  .then(() => {
    console.log("==== [worked] ====");
    process.exit(0);
  }).catch( e => {
    console.error("==== [Error]: ", e);
  });