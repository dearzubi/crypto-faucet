import { ethers } from "hardhat";
import { encoder } from "./utility/utils";
import { getPrecomputedAddress, deployWithCreat2 } from "./deployment/Create2Deployer";
import { TetherTokenUSDT__factory } from "../typechain-types";

export async function deployTetherToken(): Promise<string> {
  
  const salt = ethers.keccak256(ethers.toUtf8Bytes("buckbeak"));
  const networkName = (await ethers.provider.getNetwork()).name;

  console.log()
  console.log("====== Deploying on network:", networkName, "======")

  const initialSupply = 100000000000;
  const name = "Tether USD";
  const symbol = "USDT";
  const decimals = 6;
  const owner = (await ethers.getSigners())[0].address

  const initByteCode = TetherTokenUSDT__factory.bytecode + encoder(
    ['uint256', 'string', 'string', 'uint256', 'address'], 
    [initialSupply, name, symbol, decimals, owner]
  );

  const precomputedAddress = await getPrecomputedAddress(
    salt,
    initByteCode,
    networkName
  );
  console.log("Precomputed Tether USDT address:", precomputedAddress);

  const deployedAddress = await deployWithCreat2(
    salt,
    initByteCode,
    networkName
  );

  console.log("Tether USDT deployed at:", deployedAddress);
  console.log()

  return deployedAddress;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
deployTetherToken().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
