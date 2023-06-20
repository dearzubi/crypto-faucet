import { ethers } from "hardhat";
import { BytesLike } from "ethers";
import { expect } from "chai";
import { encoder } from "../scripts/utility/utils";
import { getPrecomputedAddress, deployWithCreat2 } from "../scripts/deployment/Create2Deployer";
import { TetherTokenUSDT__factory } from "../typechain-types";

describe("TetherTokenUSDT Tests", async () => {

  let create2DeployerAddress: string;
  let salt = ethers.keccak256(ethers.toUtf8Bytes("buckbeak"));
  let initialSupply: number = 100000000000;
  const name: string = "Tether USD";
  const symbol: string = "USDT";
  const decimals: number = 6;
  let owner: string;
  let initByteCode: BytesLike;
  let tetherAddress: string;

  before(async function () {

    owner = (await ethers.getSigners())[0]?.address
    initByteCode = TetherTokenUSDT__factory.bytecode + encoder(
      ['uint256', 'string', 'string', 'uint256', 'address'], 
      [initialSupply, name, symbol, decimals, owner]
    );

    const Create2Deployer = await ethers.getContractFactory('Create2Deployer');
    const deployer = await Create2Deployer.deploy();
    await deployer.waitForDeployment()
    create2DeployerAddress = (await deployer.getAddress());    
  });

  it("Should get precomputed address", async () => {

    const precomputedAddress = await getPrecomputedAddress(
      salt,
      initByteCode,
      "hardhat",
      create2DeployerAddress
    );

    expect(precomputedAddress).to.not.equal(ethers.ZeroAddress)

  });


  it("Precomputed address shoul be equal to the deployed address", async () => {

    const precomputedAddress = await getPrecomputedAddress(
      salt,
      initByteCode,
      "hardhat",
      create2DeployerAddress
    );

    tetherAddress = await deployWithCreat2(
      salt,
      initByteCode,
      "hardhat",
      create2DeployerAddress
    );

    expect(precomputedAddress).to.equal(tetherAddress)

  });

  it("Redeployment should revert with the already deployed address", async () => {

    const deployPromise = deployWithCreat2(
      salt,
      initByteCode,
      "hardhat",
      create2DeployerAddress
    );
    const error = await expect(deployPromise).to.eventually.be.rejectedWith(Error);
    expect(error.message).to.contain(`AlreadyDeployed("${tetherAddress}")`);
  });


  it("Different salt should deploy at a different address", async () => {

    let salt = ethers.keccak256(ethers.toUtf8Bytes("buckbeak_2"));

    const newAddress = await deployWithCreat2(
      salt,
      initByteCode,
      "hardhat",
      create2DeployerAddress
    );
    
    expect(newAddress).to.not.equal(tetherAddress)

  });

  it("Should get the owner of the contract", async () => {
      
    const tether = TetherTokenUSDT__factory.connect(tetherAddress, (await ethers.getSigners())[0]);
    const retrievedOwner = await tether.owner();

    expect(retrievedOwner).to.equal(owner);
  
  });

  it("User should be able to mint tokens", async () => {

    const user = (await ethers.getSigners())[1];

    const tether = TetherTokenUSDT__factory.connect(tetherAddress, user);
    const balanceBefore = await tether.balanceOf(user.address);

    const totalSupplyBefore = await tether.totalSupply();
    
    const tx = await tether.mint({value: ethers.parseEther("1")});
    const receipt = await tx.wait()
    if (!receipt!.status) {
      throw Error(`Tx failed: ${tx.hash}`)
    }
    const balanceAfter = await tether.balanceOf(user.address);
    const totalSupplyAfter = await tether.totalSupply();

    expect(balanceAfter).to.greaterThan(balanceBefore);
    expect(totalSupplyAfter).to.greaterThan(totalSupplyBefore);

  });


  it("User should not be able to mint tokens with less than required ethers supplied", async () => {

    const user = (await ethers.getSigners())[1];

    const tether = TetherTokenUSDT__factory.connect(tetherAddress, user);
    const minEtherRequired = await tether.minEther();
    
    const tx = tether.mint({value: (minEtherRequired - 1n)});
    expect(tx).to.be.revertedWithoutReason();

  });

  it("Owner should be able to set mint parameters", async () => {

    const owner = (await ethers.getSigners())[0];
    const tether = TetherTokenUSDT__factory.connect(tetherAddress, owner);
    const tx = await tether.setMintParams(1000, ethers.parseEther("1"));
    const receipt = await tx.wait()
    if (!receipt!.status) {
      throw Error(`Tx failed: ${tx.hash}`)
    }

    const minEtherRequired = await tether.minEther();
    const conversionRate = await tether.conversionRate();

    expect(minEtherRequired).to.equal(ethers.parseEther("1"));
    expect(conversionRate).to.equal(1000);

  });

  it("Non-Owner should not be able to set mint parameters", async () => {

    const nonOwner = (await ethers.getSigners())[1];
    const tether = TetherTokenUSDT__factory.connect(tetherAddress, nonOwner);
    const tx = tether.setMintParams(1000, ethers.parseEther("1"));
    expect(tx).to.be.revertedWithoutReason();

  });

  it("Owner should be able to withdraw funds", async () => {

    const receiverAddress = (await ethers.getSigners())[2]?.address;

    const owner = (await ethers.getSigners())[0];
    const tether = TetherTokenUSDT__factory.connect(tetherAddress, owner);

    const balanceBefore = await ethers.provider.getBalance(receiverAddress);
    const contractBalanceBefore = await ethers.provider.getBalance(tetherAddress);

    expect(contractBalanceBefore).to.not.equal(0);

    const tx = await tether.withdrawEth(receiverAddress)
    const receipt = await tx.wait()
    if (!receipt!.status) {
      throw Error(`Tx failed: ${tx.hash}`)
    }

    const balanceAfter = await ethers.provider.getBalance(receiverAddress);
    const contractBalanceAfter = await ethers.provider.getBalance(tetherAddress);

    expect(balanceAfter).to.equal(balanceBefore + contractBalanceBefore);
    expect(contractBalanceAfter).to.equal(0);

  });

  it("Non-Owner should not be able to withdraw funds", async () => {

    const nonOwner = (await ethers.getSigners())[1];
    const tether = TetherTokenUSDT__factory.connect(tetherAddress, nonOwner);
    const tx = tether.withdrawEth(nonOwner.address)
    expect(tx).to.be.revertedWithoutReason();

  });

});