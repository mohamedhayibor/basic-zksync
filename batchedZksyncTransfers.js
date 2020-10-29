const ethers = require("ethers");
const zksync = require("zksync");

require("dotenv").config();


async function main() {
  const ethersProvider = new ethers.getDefaultProvider("rinkeby");
  const syncProvider = await zksync.getDefaultProvider("rinkeby");

  const ethWallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY).connect(ethersProvider);

  const syncWallet = await zksync.Wallet.fromEthSigner(ethWallet, syncProvider);



  console.log("==== [checkout starts] user addr: ", ethWallet.address);
  
  const donations = [
    {
      addr: process.env.PUBLIC_ADDR_1,
      amount: ethers.utils.parseEther("0.001")
    },
    {
      addr: process.env.PUBLIC_ADDR_2,
      amount: ethers.utils.parseEther("0.001")
    }];

  // console.log(ethers.utils.getAddress(donations[1].addr))

  const walletState = await syncWallet.getAccountState();

  console.log(">> walletState: ", walletState);

  const amount = zksync.utils.closestPackableTransactionAmount(
    ethers.utils.parseEther("0.001")
  );

  // Time to transfer bulk
  const transferA = {
    to: donations[0].addr,
    token: "ETH",
    amount: donations[0].amount,
    fee: ethers.utils.parseEther("0.001")
  };

  const transferB = {
    to: donations[1].addr,
    token: "ETH",
    amount: donations[1].amount,
    fee: ethers.utils.parseEther("0.001")
  };

  const transferBulk = await syncWallet.syncMultiTransfer([transferA, transferB]);

  console.log(">>>> [Final]: ", transferBulk);
}



main()
  .then(() => {
    console.log("==== Worked ====");
    process.exit(0);
  })
  .catch(e => {
    console.error(">>> [Error]: ", e);
    process.exit(1);
  })