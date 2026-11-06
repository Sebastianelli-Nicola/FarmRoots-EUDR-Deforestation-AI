import type { RiskLevel } from '../types/lot'

export interface BlockchainPackage {
  lotId: string;
  coordinates: string;
  date: string;
  riskScore: number;
  riskLevel: RiskLevel;
  signature: string;
  txHash: string;
  network: 'polygon';
  submittedAt: string;
  status: 'certified' | 'blocked' | 'pending';
}

function randomHex(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

async function mockSign(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function submitToBlockchain(
  lotId: string,
  coordinates: string,
  date: string,
  riskScore: number,
  riskLevel: RiskLevel,
  status: 'certified' | 'blocked',
): Promise<BlockchainPackage> {
  const payload = JSON.stringify({ lotId, coordinates, date, riskScore, riskLevel })
  const signature = await mockSign(payload)
  const txHash = '0x' + randomHex(64)

  return {
    lotId,
    coordinates,
    date,
    riskScore,
    riskLevel,
    signature,
    txHash,
    network: 'polygon',
    submittedAt: new Date().toISOString(),
    status,
  }
}
