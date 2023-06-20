import { HardhatUserConfig, task} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import { ethers } from "ethers";
dotenv.config();

const {
  API_URL_GOERLI,
  API_URL_SEPLOIA,
  API_URL_POLYGON_POS,
  API_URL_MUMBAI,
  PRIVATE_KEY,
} = process.env;

task("nonce", "Prints the list of account nonce across supported networks")
.addParam("address")
.setAction(async (address) => {

  const goerliProvider = new ethers.JsonRpcProvider(API_URL_GOERLI);
  const seploiaProvider = new ethers.JsonRpcProvider(API_URL_SEPLOIA);
  const polygonPosProvider = new ethers.JsonRpcProvider(API_URL_POLYGON_POS);
  const mumbaiProvider = new ethers.JsonRpcProvider(API_URL_MUMBAI);
  
  const networkIDArr = ["Ethereum Goerli:", "Ethereum Sepolia:", "Polygon  Mumbai:", "Polygon PoS:"]
  const providerArr = [goerliProvider, seploiaProvider, mumbaiProvider, polygonPosProvider];
  const resultArr = [];
  
  for (let i = 0; i < providerArr.length; i++) {
    const nonce = await providerArr[i].getTransactionCount(address.address, "latest");
    const balance = await providerArr[i].getBalance(address.address)
    resultArr.push([networkIDArr[i], nonce, parseFloat(ethers.formatEther(balance)).toFixed(2) + "ETH"]);
  }
  resultArr.unshift(["  |NETWORK|   |NONCE|   |BALANCE|  "])
  console.log(resultArr);
});

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: {
    compilers:[
      {
        version: "0.4.18",
      }
      ,
      {
        version: "0.8.18",
        settings:{
          optimizer: {
            enabled: true,
            runs: 200,
          }
        }
      }
    ]
  },
  networks: {
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true,
    },
    goerli: {
      url: API_URL_GOERLI,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    mumbai: {
      url: API_URL_MUMBAI,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    sepolia: {
      url: API_URL_SEPLOIA,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    polygonPos: {
      url: API_URL_POLYGON_POS,
      accounts: [`0x${PRIVATE_KEY}`],
    }
  }
};

export default config;
