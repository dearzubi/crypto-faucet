import { ethers } from "hardhat";

export async function deployCreate2Deployer(): Promise<string> {
  const networkName = (await ethers.provider.getNetwork()).name;
  console.log()
  console.log("====== Deploying on network:", networkName, "======")

  const Create2Deployer = await ethers.getContractFactory('Create2Deployer');
  const create2Deployer = await Create2Deployer.deploy();
  await create2Deployer.waitForDeployment()
  console.log('Create2Deployer deployed at:', (await create2Deployer.getAddress()));
  console.log()
  return (await create2Deployer.getAddress());
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
deployCreate2Deployer().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
