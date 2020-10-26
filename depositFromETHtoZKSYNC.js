const ethers = require("ethers");
const zksync = require("zksync");

require("dotenv").config();

async function depositFromETHtoZKSYNC() {
  console.log("==== depositFromETHtoZKSYNC() ====");

  // To interact with Sync network users need to know the endpoint to the operator node
  const syncProvider = await zksync.getDefaultProvider("rinkeby");

  // ethers to interact with Ethereum
  const ethersProvider = new ethers.getDefaultProvider("rinkeby");

  // create ethereum wallet using ethers
  const ethWallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY).connect(ethersProvider);

  // Derive zksync.Signer from ethereum wallet
  const syncWallet = await zksync.Wallet.fromEthSigner(ethWallet, syncProvider);

  // deposit 0.01 eth to our zkSync account
  const deposit = await syncWallet.depositToSyncFromEthereum({
    depositTo: syncWallet.address(),
    token: "ETH",
    amount: ethers.utils.parseEther("0.01")
  });

  /* After the tx is submitted to Ethereum node, we can track its status using the returned object */
  // Await confirmation from the zkSync operator
  // Completes when a promise is issued to process tx
  const depositReceipt = await deposit.awaitReceipt().catch( e => {
    console.log(">> [Error: deposit.awaitReceipt()]: ", e);
    process.exit(1);
  });

  console.log("[depositReceipt]: ", depositReceipt);

  console.log("==== [worked] ====");
}

depositFromETHtoZKSYNC()
  .then( () => process.exit(0))
  .catch( e => {
    console.error("> [Error]: ", e);
    process.exit(1);
  });