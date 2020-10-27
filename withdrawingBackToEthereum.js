
const ethers = require("ethers");
const zksync = require("zksync");

require("dotenv").config();

async function checkAndRegisterSigningKey(syncWallet) {
  if (! await syncWallet.isSigningKeySet()) {
      if (await syncWallet.getAccountId() == undefined) {
        // this means the account has never interacted with the network
        throw new Error("Unknwon account");
      } 
  
      // Get the first token listed and use that to pay for signing key transaction
      const syncWalletState = await syncWallet.getAccountState();
      console.log(">> syncWalletState: ", syncWalletState);
  
      const tokensInWallet = Object.keys(syncWalletState.committed.balances);
      console.log(">> tokensInWallet: ", tokensInWallet);
      
      const feeToken = tokensInWallet[0];
      console.log(">> feeToken: ", feeToken);
  
      // Determine how to set key based on wallet type
      let changePubkey;
  
      if (syncWallet.ethSignerType.verificationMethod === 'ECDSA') {
        console.log('>> Using ECDSA to set signing key');
        changePubkey = await syncWallet.setSigningKey({ feeToken });
      } else {
        console.log(">> Using ERC-1271 to set signing key. This requires an on-chain transaction");
        const signingKeyTx = await syncWallet.onchainAuthSigningKey();
        console.log(">> signingKeyTx: ", signingKeyTx);
  
        changePubkey = await syncWallet.setSigningKey({ feeToken, onchainAuth: true });
      }
  
      // Wait until the tx is committed
      console.log('Signing key set, waiting for transaction receipt');
  
      await changePubkey.awaitReceipt();
  
      console.log(">> Specified sync wallet is ready to use on zkSync");
  
  } else {
      console.log(">> specified sync wallet is already INITIALIZED")
  }

  return;
}

async function unlockZkSyncAccount(syncWallet) {
  if (! await syncWallet.isSigningKeySet()) {
    if (await syncWallet.getAccountId() == undefined) {
        throw new Error("Unknwon account");
    } 

    const changePubkey = await syncWallet.setSigningKey();

    // Wait until the tx is committed
    await changePubkey.awaitReceipt();
  }
}

// since eth address 1 sent 0.002 eth to address 2, lets withdraw 0.001 eth in layer1
// https://rinkeby.zkscan.io/explorer/accounts/0x54f04e1b66cc1fc21f0411ef0184393dee3928de

async function withdrawingBackToEthereum() {
  console.log("==== withdrawingBackToEthereum() ====");

  // To interact with Sync network users need to know the endpoint to the operator node
  const syncProvider = await zksync.getDefaultProvider("rinkeby");
  // ethers to interact with Ethereum
  const ethersProvider = new ethers.getDefaultProvider("rinkeby");

  const ethWallet2 = new ethers.Wallet(process.env.ETH_PRIVATE_KEY_2).connect(ethersProvider);
  const syncWallet2 = await zksync.Wallet.fromEthSigner(ethWallet2, syncProvider);

  const fee = zksync.utils.closestPackableTransactionFee(ethers.utils.parseEther("0.001"));

  // 1st trial
  // await checkAndRegisterSigningKey(syncWallet2);

  // 2nd trial
  // await unlockZkSyncAccount(syncWallet2);

  const withdraw = await syncWallet2.withdrawFromSyncToEthereum({
    ethAddress: ethWallet2.address,
    token: "ETH",
    amount: ethers.utils.parseEther("0.001"),
    fee
  });

  console.log(">> withdraw: ", withdraw);
  
  // waiting until ZKP verification
  let zkpVerification = await withdraw.awaitVerifyReceipt();

  console.log(">> [zkpVerification] ", zkpVerification)

  console.log("==== [worked] ====");
}

withdrawingBackToEthereum()
  .then( () => process.exit(0))
  .catch( e => {
    console.error("> [Error]: ", e);
    process.exit(1);
  });