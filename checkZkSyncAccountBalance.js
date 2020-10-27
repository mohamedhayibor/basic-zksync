const ethers = require("ethers");
const zksync = require("zksync");

require("dotenv").config();

async function checkZkSyncAccountBalance() {
  console.log("==== checkZkSyncAccountBalance() ====");

  // To interact with Sync network users need to know the endpoint to the operator node
  const syncProvider = await zksync.getDefaultProvider("rinkeby");

  // ethers to interact with Ethereum
  const ethersProvider = new ethers.getDefaultProvider("rinkeby");

  // create ethereum wallet using ethers
  const ethWallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY).connect(ethersProvider);

  // Derive zksync.Signer from ethereum wallet
  const syncWallet = await zksync.Wallet.fromEthSigner(ethWallet, syncProvider);

  // check the balance from committed state (not final yet)
  const committedETHBalance = await syncWallet.getBalance("ETH").catch( e => {
    console.log(">> [Error: committedETHBalance()]: ", e);
    process.exit(1);
  });

  console.log(">> [committedETHBalance]: ", committedETHBalance.toString());

  // check balance from verified state (final)
  const verifiedETHBalance = await syncWallet.getBalance("ETH", "verified").catch( e => {
    console.log(">> [Error: verifiedETHBalance()]: ", e);
    process.exit(1);
  });

  console.log(">> [verifiedETHBalance]: ", verifiedETHBalance.toString());

  console.log("==== [To list all tokens of this account at once] ====");

  const accountState = await syncWallet.getAccountState().catch( e => {
    console.log(">> [Error: syncWallet.getAccountState()]: ", e);
    process.exit(1);
  });

  console.log(">> [accountState]: ", accountState);

  console.log("==== [worked] ====");
}

checkZkSyncAccountBalance()
  .then( () => process.exit(0))
  .catch( e => {
    console.error("> [Error]: ", e);
    process.exit(1);
  });