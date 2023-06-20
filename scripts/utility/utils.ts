import {ethers} from 'ethers';

export const encoder = (types: string[], values: any[]) => {
  const abiCoder = new ethers.AbiCoder();
  const encodedParams = abiCoder.encode(types, values);
  return encodedParams.slice(2);
};