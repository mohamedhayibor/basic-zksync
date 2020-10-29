
const ethers = require("ethers");
const zksync = require("zksync");

require("dotenv").config();

async function zkSyncTransfer() {
  console.log("==== zkSyncTransfer() ====");

  // To interact with Sync network users need to know the endpoint to the operator node
  const syncProvider = await zksync.getDefaultProvider("rinkeby");

  // ethers to interact with Ethereum
  const ethersProvider = new ethers.getDefaultProvider("rinkeby");

  // create ethereum wallet using ethers
  const ethWallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY).connect(ethersProvider);
  // Derive zksync.Signer from ethereum wallet
  const syncWallet = await zksync.Wallet.fromEthSigner(ethWallet, syncProvider);

  // Note: we can send assets to any fresh Ethereum account, without preliminary registration
  const ethWallet2 = new ethers.Wallet(process.env.ETH_PRIVATE_KEY_2).connect(ethersProvider);
  const syncWallet2 = await zksync.Wallet.fromEthSigner(ethWallet2, syncProvider);

  // https://github.com/gitcoinco/web/blob/a068b7415c7a8398a16e542ddd9aa1d583b040e2/app/assets/v2/js/cart.js#L1511-L1553
  console.log("==== Registering public key to unlock deterministic wallet on zkSync...");

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

  const amount = zksync.utils.closestPackableTransactionAmount(ethers.utils.parseEther("0.004"));
  const fee = zksync.utils.closestPackableTransactionFee(ethers.utils.parseEther("0.001"));

  const transfer = await syncWallet.syncTransfer({
    to: syncWallet2.address(),
    token: "ETH",
    amount,
    fee,
    onchainAuth: true
  }).catch( e => {
    console.log(">> [Error: syncWallet.syncTransfer()]: ", e);
    process.exit(1);
  });

  console.log(">> [transfer]: ", transfer);

  // track status of transaction
  const transferReceipt = await transfer.awaitReceipt().catch( e => {
    console.log(">> [Error: transfer.awaitReceipt()]: ", e);
    process.exit(1);
  });

  console.log(">> [transferReceipt]: ", transferReceipt);

  console.log("==== [worked] ====");
}

zkSyncTransfer()
  .then( () => process.exit(0))
  .catch( e => {
    console.error("> [Error]: ", e);
    process.exit(1);
  });