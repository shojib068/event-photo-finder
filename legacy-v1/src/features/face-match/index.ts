// Public entry of face-match.
export { matchSelfie, checkSelfieQuality } from './services';
export { handleGetAvailability, handleMatch } from './api/handlers';
export { MatchProvider, useMatch, isSelfieQualityError } from './hooks/match-context';
export { useEventAvailability, type AvailabilityState } from './hooks/use-event-availability';
export type { MatchResult, MatchState, MatchErrorCode, MatchResponse, AvailabilityResponse } from './types';
export { WelcomeScreen } from './components/WelcomeScreen';
export { AvailabilityGate } from './components/AvailabilityGate';
export { NotAvailableScreen } from './components/NotAvailableScreen';
export { SearchingScreen } from './components/SearchingScreen';
export { NoMatchScreen } from './components/NoMatchScreen';
