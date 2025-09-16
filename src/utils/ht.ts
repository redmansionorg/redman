import { NullAttributeValue } from "aws-sdk/clients/dynamodbstreams";

// utils/format.ts
export const ht = (str: string|undefined|null, keep: number = 10): string => {
  if (!str) return '';
  return str.length <= keep * 2 + 3 ? str : `${str.slice(0, keep)}...${str.slice(-keep)}`;
};
