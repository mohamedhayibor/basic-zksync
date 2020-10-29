const ethers = require("ethers");
const zksync = require("zksync");

require("dotenv").config();


async function unlockZkSyncAccount() {
  console.log("==== Does not work for now | ZkSync need to update documentation ====");
  // console.log("==== unlockZkSyncAccount() ====");

  // To interact with Sync network users need to know the endpoint to the operator node
  const syncProvider = await zksync.getDefaultProvider("rinkeby");

  // ethers to interact with Ethereum
  const ethersProvider = new ethers.getDefaultProvider("rinkeby");

  // create ethereum wallet using ethers
  const ethWallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY).connect(ethersProvider);

  // Derive zksync.Signer from ethereum wallet
  const syncWallet = await zksync.Wallet.fromEthSigner(ethWallet, syncProvider);

  // To control assets in zkSync network, an account must register a separate public key once
  if(! await syncWallet.isSigningKeySet()) {
    if (await syncWallet.getAccountId() == undefined) {
      throw new Error("Unknown account");
    }

    // TODO - FIX TypeError: Cannot read property 'nonce' of undefined
    const changePubkey = await syncWallet.setSigningKey().catch( e => {
      console.log(">> [Error: syncWallet.setSigningKey()]: ", e);
      process.exit(1);
    });

    // Wait till the tx is committed
    await changePubkey.awaitReceipt().catch( e => {
      console.log(">> [Error: changePubkey.awaitReceipt()]: ", e);
      process.exit(1);
    });
  }

  console.log("==== [worked] ====");
}

unlockZkSyncAccount()
  .then( () => process.exit(0))
  .catch( e => {
    console.error("> [Error]: ", e);
    process.exit(1);
  });