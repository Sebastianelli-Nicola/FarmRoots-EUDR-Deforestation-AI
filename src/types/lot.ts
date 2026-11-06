export type CommodityType = 'wood' | 'cattle' | 'soy' | 'cocoa' | 'coffee' | 'palm_oil' | 'rubber';
export type RiskLevel = 'green' | 'amber' | 'red';

export interface LotGeolocation {
  type: 'Point' | 'Polygon';
  coordinates: number[] | number[][][];
  hectares: number;
}

export interface Lot {
  id: string;
  commodity: CommodityType;
  supplierId: string;
  subSupplierId?: string;
  quantity: number;
  harvestDate: string;
  geolocation: LotGeolocation;
  geoJsonCoordinates: GeoJSON.Feature;
  deforestationFreeProof?: string;
  deforestationDetected?: boolean;
  riskLevel: RiskLevel;
  riskScore: number;
  blockchainTxHash?: string;
  blockedAt?: string;
  createdAt: string;
}
