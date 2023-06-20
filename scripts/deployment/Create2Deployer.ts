import { ethers } from "hardhat";
import { Create2Deployer__factory } from "../../typechain-types";
import { IDeploymentInfo } from "../types/types";
import _InfoCreate2Deployer from "../../deployments/Create2Deployer/info.json";
import { BytesLike, ContractTransactionReceipt, ErrorDescription} from "ethers";

const InfoCreate2Deployer: { [key: string]: IDeploymentInfo } = _InfoCreate2Deployer;

export async function getPrecomputedAddress(
  salt: BytesLike,
  initByteCode: BytesLike,
  networkName?: string,
  factoryAddress?: string
): Promise<string> {

  const address = factoryAddress || InfoCreate2Deployer[networkName ?? "hardhat"]?.address;

  if(!address) throw new Error("Create2Deployer not deployed on this network");

  const create2Deployer = Create2Deployer__factory.connect(
    address, 
    (await ethers.getSigners())[0]
  );
  
  const precomputedAddress = await create2Deployer["computeAddress(bytes32,bytes32)"](
    salt,
    ethers.keccak256(initByteCode)
  );

  return precomputedAddress;
}

export async function deployWithCreat2(
  salt: BytesLike,
  initByteCode: BytesLike,
  networkName?: string,
  factoryAddress?: string
): Promise<string> {

  const address = factoryAddress || InfoCreate2Deployer[networkName ?? "hardhat"]?.address;

  if(!address) throw new Error("Create2Deployer not deployed on this network");

  const create2Deployer = Create2Deployer__factory.connect(
    address, 
    (await ethers.getSigners())[0]
  );

  try{
    const tx = await create2Deployer.deploy(
      salt,
      initByteCode
    )
    const receipt = (await tx.wait()) as ContractTransactionReceipt;

    const event = create2Deployer.interface.decodeEventLog(
      'Create2Deployed',
      receipt?.logs[0].data,
      receipt?.logs[0].topics
    )

    return event[0];
  }catch(e: any){
    if(e?.data?.data){
      const decodedError = create2Deployer.interface.parseError(e.data.data) as ErrorDescription;
      console.log(decodedError);
      if(decodedError.name === 'AlreadyDeployed'){
        return decodedError.args[0];
      }
      else if (decodedError.name === "FailedOnDeploy") {
        throw new Error("Failed to Deploy");
      }  
      else { throw e; }
    }
    else {throw e; }
  }
}