export interface IDeploymentInfo {
  address: string;
  deployer: string;
  chainId: number;
  deployedAtNonce?: number;
  owner?: string;
}