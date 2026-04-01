export type Player = 'player1' | 'player2';
export type UnitType = 'commander' | 'soldier' | 'knight' | 'fort';
export type OrderType = 'move' | 'attack' | 'hold';
export type GameMode = 'ai' | 'local';
export type GameScreen = 'menu' | 'howToPlay' | 'game' | 'victory';
export type TurnPhase = 'player1Orders' | 'handoff' | 'player2Orders' | 'resolution' | 'results';

export interface Position {
  col: number; // 0-9
  row: number; // 0-9
}

export interface Unit {
  id: string;
  type: UnitType;
  owner: Player;
  position: Position;
  baseStrength: number;
}

export interface Order {
  unitId: string;
  type: OrderType;
  target?: Position;
}

export interface CrownCity {
  position: Position;
  owner: Player | null;
}

export interface CombatResult {
  attacker: Unit;
  defender: Unit;
  attackerStrength: number;
  defenderStrength: number;
  outcome: 'attackerWins' | 'defenderWins' | 'bounce';
  description: string;
}

export interface GameState {
  units: Unit[];
  crownCities: CrownCity[];
  turn: number;
  phase: TurnPhase;
  player1Orders: Order[];
  player2Orders: Order[];
  combatLog: CombatResult[];
  winner: Player | null;
  winReason: string;
  mode: GameMode;
  selectedUnitId: string | null;
  attackMode: boolean;
  highlightedTiles: Position[];
  highlightType: 'move' | 'attack' | null;
}

export const COLUMNS = ['A','B','C','D','E','F','G','H','I','J'];

export const CROWN_CITY_POSITIONS: Position[] = [
  { col: 2, row: 2 },  // C3
  { col: 7, row: 2 },  // H3
  { col: 4, row: 4 },  // E5
  { col: 2, row: 7 },  // C8
  { col: 7, row: 7 },  // H8
];

export function posKey(p: Position): string {
  return `${p.col},${p.row}`;
}

export function posEqual(a: Position, b: Position): boolean {
  return a.col === b.col && a.row === b.row;
}

export function posLabel(p: Position): string {
  return `${COLUMNS[p.col]}${p.row + 1}`;
}
