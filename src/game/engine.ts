import {
  GameState, Unit, Order, Position, Player, CrownCity, CombatResult,
  CROWN_CITY_POSITIONS, posEqual, posKey, posLabel, GameMode,
} from './types';

export function createInitialState(mode: GameMode): GameState {
  const units: Unit[] = [
    // Player 1 (bottom, rows 8-9)
    { id: 'p1-commander', type: 'commander', owner: 'player1', position: { col: 4, row: 9 }, baseStrength: 2 },
    { id: 'p1-soldier1', type: 'soldier', owner: 'player1', position: { col: 3, row: 9 }, baseStrength: 1 },
    { id: 'p1-soldier2', type: 'soldier', owner: 'player1', position: { col: 5, row: 9 }, baseStrength: 1 },
    { id: 'p1-soldier3', type: 'soldier', owner: 'player1', position: { col: 4, row: 8 }, baseStrength: 1 },
    { id: 'p1-knight', type: 'knight', owner: 'player1', position: { col: 6, row: 9 }, baseStrength: 2 },
    { id: 'p1-fort', type: 'fort', owner: 'player1', position: { col: 2, row: 9 }, baseStrength: 1 },
    // Player 2 (top, rows 0-1) mirrored
    { id: 'p2-commander', type: 'commander', owner: 'player2', position: { col: 5, row: 0 }, baseStrength: 2 },
    { id: 'p2-soldier1', type: 'soldier', owner: 'player2', position: { col: 6, row: 0 }, baseStrength: 1 },
    { id: 'p2-soldier2', type: 'soldier', owner: 'player2', position: { col: 4, row: 0 }, baseStrength: 1 },
    { id: 'p2-soldier3', type: 'soldier', owner: 'player2', position: { col: 5, row: 1 }, baseStrength: 1 },
    { id: 'p2-knight', type: 'knight', owner: 'player2', position: { col: 3, row: 0 }, baseStrength: 2 },
    { id: 'p2-fort', type: 'fort', owner: 'player2', position: { col: 7, row: 0 }, baseStrength: 1 },
  ];

  const crownCities: CrownCity[] = CROWN_CITY_POSITIONS.map(p => ({ position: p, owner: null }));

  return {
    units,
    crownCities,
    turn: 1,
    phase: 'player1Orders',
    player1Orders: [],
    player2Orders: [],
    combatLog: [],
    winner: null,
    winReason: '',
    mode,
    selectedUnitId: null,
    attackMode: false,
    highlightedTiles: [],
    highlightType: null,
  };
}

export function getUnitAt(units: Unit[], pos: Position): Unit | undefined {
  return units.find(u => posEqual(u.position, pos));
}

export function getValidMoves(unit: Unit, allUnits: Unit[]): Position[] {
  const moves: Position[] = [];
  const { col, row } = unit.position;

  switch (unit.type) {
    case 'commander': {
      // Moves horizontally or vertically any distance, cannot pass through units
      const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      for (const [dc, dr] of dirs) {
        for (let i = 1; i < 10; i++) {
          const nc = col + dc * i;
          const nr = row + dr * i;
          if (nc < 0 || nc > 9 || nr < 0 || nr > 9) break;
          const blocking = getUnitAt(allUnits, { col: nc, row: nr });
          if (blocking) break;
          moves.push({ col: nc, row: nr });
        }
      }
      break;
    }
    case 'soldier': {
      const forward = unit.owner === 'player1' ? -1 : 1;
      // Forward
      const fPos = { col, row: row + forward };
      if (fPos.row >= 0 && fPos.row <= 9 && !getUnitAt(allUnits, fPos)) moves.push(fPos);
      // Sideways
      for (const dc of [-1, 1]) {
        const sPos = { col: col + dc, row };
        if (sPos.col >= 0 && sPos.col <= 9 && !getUnitAt(allUnits, sPos)) moves.push(sPos);
      }
      break;
    }
    case 'knight': {
      const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dc, dr] of knightMoves) {
        const nc = col + dc;
        const nr = row + dr;
        if (nc >= 0 && nc <= 9 && nr >= 0 && nr <= 9 && !getUnitAt(allUnits, { col: nc, row: nr })) {
          moves.push({ col: nc, row: nr });
        }
      }
      break;
    }
    case 'fort': {
      // 1 or 2 tiles horizontally or vertically, cannot move onto Crown Cities
      const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      for (const [dc, dr] of dirs) {
        for (let i = 1; i <= 2; i++) {
          const nc = col + dc * i;
          const nr = row + dr * i;
          if (nc < 0 || nc > 9 || nr < 0 || nr > 9) break;
          if (getUnitAt(allUnits, { col: nc, row: nr })) break;
          if (CROWN_CITY_POSITIONS.some(c => posEqual(c, { col: nc, row: nr }))) break;
          moves.push({ col: nc, row: nr });
        }
      }
      break;
    }
  }
  return moves;
}

export function getValidAttacks(unit: Unit, allUnits: Unit[]): Position[] {
  const { col, row } = unit.position;
  const adjacent = [
    { col: col - 1, row },
    { col: col + 1, row },
    { col, row: row - 1 },
    { col, row: row + 1 },
  ];

  if (unit.type === 'soldier') {
    const forward = unit.owner === 'player1' ? -1 : 1;
    const attackPos = { col, row: row + forward };
    if (attackPos.row >= 0 && attackPos.row <= 9) {
      const target = getUnitAt(allUnits, attackPos);
      if (target && target.owner !== unit.owner) return [attackPos];
    }
    return [];
  }

  // Commander, Knight, Fort: adjacent attacks
  return adjacent.filter(p => {
    if (p.col < 0 || p.col > 9 || p.row < 0 || p.row > 9) return false;
    const target = getUnitAt(allUnits, p);
    return target && target.owner !== unit.owner;
  });
}

function getFortBonus(unit: Unit, allUnits: Unit[]): number {
  const friendlyForts = allUnits.filter(u => u.type === 'fort' && u.owner === unit.owner);
  for (const fort of friendlyForts) {
    const dx = Math.abs(unit.position.col - fort.position.col);
    const dy = Math.abs(unit.position.row - fort.position.row);
    if (dx <= 1 && dy <= 1 && (dx + dy > 0 || unit.id === fort.id)) {
      if (unit.id !== fort.id) return 2;
    }
  }
  return 0;
}

export function getEffectiveStrength(unit: Unit, allUnits: Unit[]): number {
  return unit.baseStrength + getFortBonus(unit, allUnits);
}

export function getFortInfluenceTiles(fort: Unit): Position[] {
  const tiles: Position[] = [];
  for (let dc = -1; dc <= 1; dc++) {
    for (let dr = -1; dr <= 1; dr++) {
      const c = fort.position.col + dc;
      const r = fort.position.row + dr;
      if (c >= 0 && c <= 9 && r >= 0 && r <= 9 && !(dc === 0 && dr === 0)) {
        tiles.push({ col: c, row: r });
      }
    }
  }
  return tiles;
}

export function resolveOrders(state: GameState): GameState {
  let units = state.units.map(u => ({ ...u }));
  const allOrders = [...state.player1Orders, ...state.player2Orders];
  const combatLog: CombatResult[] = [];

  // Build intended positions map
  const intendedPositions = new Map<string, Position>();
  const moveOrders = allOrders.filter(o => o.type === 'move' && o.target);
  const attackOrders = allOrders.filter(o => o.type === 'attack' && o.target);

  for (const order of moveOrders) {
    intendedPositions.set(order.unitId, order.target!);
  }

  // Check for swap conflicts
  const swapFails = new Set<string>();
  for (const [id1, pos1] of intendedPositions) {
    for (const [id2, pos2] of intendedPositions) {
      if (id1 >= id2) continue;
      const u1 = units.find(u => u.id === id1);
      const u2 = units.find(u => u.id === id2);
      if (u1 && u2 && posEqual(pos1, u2.position) && posEqual(pos2, u1.position)) {
        swapFails.add(id1);
        swapFails.add(id2);
      }
    }
  }

  // Check collisions (multiple units moving to same tile)
  const tileOccupants = new Map<string, string[]>();
  for (const [unitId, pos] of intendedPositions) {
    if (swapFails.has(unitId)) continue;
    const key = posKey(pos);
    if (!tileOccupants.has(key)) tileOccupants.set(key, []);
    tileOccupants.get(key)!.push(unitId);
  }

  // Resolve movement collisions
  const moveFails = new Set<string>();
  for (const [, ids] of tileOccupants) {
    if (ids.length > 1) {
      // Combat between moving units
      const movingUnits = ids.map(id => units.find(u => u.id === id)!).filter(Boolean);
      if (movingUnits.length === 2) {
        const [a, b] = movingUnits;
        if (a.owner !== b.owner) {
          const result = resolveCombat(a, b, units);
          combatLog.push(result);
          if (result.outcome === 'attackerWins') {
            units = units.filter(u => u.id !== b.id);
            moveFails.add(b.id);
          } else if (result.outcome === 'defenderWins') {
            units = units.filter(u => u.id !== a.id);
            moveFails.add(a.id);
          } else {
            moveFails.add(a.id);
            moveFails.add(b.id);
          }
        } else {
          ids.forEach(id => moveFails.add(id));
        }
      } else {
        ids.forEach(id => moveFails.add(id));
      }
    }
  }

  // Apply valid moves
  for (const [unitId, pos] of intendedPositions) {
    if (swapFails.has(unitId) || moveFails.has(unitId)) continue;
    const unit = units.find(u => u.id === unitId);
    if (unit) {
      unit.position = { ...pos };
    }
  }

  // Resolve attacks
  for (const order of attackOrders) {
    const attacker = units.find(u => u.id === order.unitId);
    if (!attacker || !order.target) continue;
    const defender = getUnitAt(units, order.target);
    if (!defender || defender.owner === attacker.owner) continue;

    const result = resolveCombat(attacker, defender, units);
    combatLog.push(result);

    if (result.outcome === 'attackerWins') {
      units = units.filter(u => u.id !== defender.id);
    } else if (result.outcome === 'defenderWins') {
      units = units.filter(u => u.id !== attacker.id);
    }
    // bounce: nothing happens
  }

  // Update city control
  const crownCities = state.crownCities.map(city => {
    const unitOnCity = getUnitAt(units, city.position);
    return { ...city, owner: unitOnCity ? unitOnCity.owner : null };
  });

  // Check victory
  let winner: Player | null = null;
  let winReason = '';

  const p1Cities = crownCities.filter(c => c.owner === 'player1').length;
  const p2Cities = crownCities.filter(c => c.owner === 'player2').length;

  if (p1Cities >= 3) { winner = 'player1'; winReason = 'Controls 3 Crown Cities!'; }
  else if (p2Cities >= 3) { winner = 'player2'; winReason = 'Controls 3 Crown Cities!'; }

  if (!winner) {
    const p1Commander = units.find(u => u.type === 'commander' && u.owner === 'player1');
    const p2Commander = units.find(u => u.type === 'commander' && u.owner === 'player2');
    if (!p1Commander) { winner = 'player2'; winReason = 'Commander destroyed!'; }
    if (!p2Commander) { winner = 'player1'; winReason = 'Commander destroyed!'; }
  }

  return {
    ...state,
    units,
    crownCities,
    combatLog,
    winner,
    winReason,
    phase: 'results',
    selectedUnitId: null,
    attackMode: false,
    highlightedTiles: [],
    highlightType: null,
  };
}

function resolveCombat(attacker: Unit, defender: Unit, allUnits: Unit[]): CombatResult {
  const aStr = getEffectiveStrength(attacker, allUnits);
  const dStr = getEffectiveStrength(defender, allUnits);

  const fortInvolved = attacker.type === 'fort' || defender.type === 'fort';

  let outcome: CombatResult['outcome'];
  if (fortInvolved) {
    outcome = 'bounce';
  } else if (aStr > dStr) {
    outcome = 'attackerWins';
  } else if (dStr > aStr) {
    outcome = 'defenderWins';
  } else {
    outcome = 'bounce';
  }

  const desc = `${posLabel(attacker.position)} ${attacker.type}(${aStr}) vs ${posLabel(defender.position)} ${defender.type}(${dStr}) → ${
    outcome === 'attackerWins' ? 'Attacker wins!' : outcome === 'defenderWins' ? 'Defender wins!' : 'Bounce!'
  }`;

  return { attacker, defender, attackerStrength: aStr, defenderStrength: dStr, outcome, description: desc };
}
