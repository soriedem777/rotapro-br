
export type TravelMode = 'driving' | 'walking';

export type VisitStatus = 'pending' | 'do_not_return' | 'possibility' | 'closed';

export interface Stop {
  id: string;
  address: string;
  isCurrentLocation?: boolean;
}

export interface RouteInstruction {
  text: string;
  distance: string;
  icon: 'left' | 'right' | 'straight' | 'uturn' | 'destination' | 'start' | 'roundabout' | 'generic';
  lat?: number;
  lng?: number;
}

export interface OptimizedStep {
  stopName: string;
  address: string;
  lat: number;
  lng: number;
  estimatedArrival?: string;
  distanceFromPrev?: string;
  legDuration?: string;
  notes?: string;
  googleMapsUrl?: string;
  instructions?: RouteInstruction[];
  legGeometry?: [number, number][];
  status?: VisitStatus;
  photo?: RoutePhoto;
  arrivalTime?: number;
  departureTime?: number;
  userNotes?: string;
}

export interface RouteResult {
  steps: OptimizedStep[];
  totalDistance: string;
  totalTime: string;
  summary: string;
  routeGeometry?: [number, number][];
}

export interface SavedRoute {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  isRoundTrip: boolean;
  stops: Stop[];
  createdAt: number;
}

export interface RoutePhoto {
  id: string;
  base64: string;
  timestamp: number;
  verifiedLat?: number; // Coordenada capturada no momento da foto
  verifiedLng?: number; // Coordenada capturada no momento da foto
  accuracy?: number;    // Precisão do GPS no momento da foto
}

export interface RouteHistoryItem {
  id: string;
  date: number;
  name: string;
  result: RouteResult;
  photosCount: number;
}

export enum OptimizationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
