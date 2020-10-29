const ethers = require("ethers");
const zksync = require("zksync");

require("dotenv").config();

// this is emergency style lol
async function withdrawingBackToEthereum() {
  console.log("==== withdrawingBackToEthereum() ====");

  const syncProvider = await zksync.getDefaultProvider("rinkeby");
  const ethersProvider = new ethers.getDefaultProvider("rinkeby");

  const ethWallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY_2).connect(ethersProvider);
  const syncWallet = await zksync.Wallet.fromEthSigner(ethWallet, syncProvider);

  const emergencyWithdrawBroadcast = await syncWallet.emergencyWithdraw({ token: "ETH" });

  console.log(">>> [emergencyWithdrawBroadcast]: ", emergencyWithdrawBroadcast);

  console.log("==== [worked] ====");
}

withdrawingBackToEthereum()
  .then( () => process.exit(0))
  .catch( e => {
    console.error("> [Error]: ", e);
    process.exit(1);
  });