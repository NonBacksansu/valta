import { GameState, Order, Unit, Position, CROWN_CITY_POSITIONS, posEqual } from './types';
import { getValidMoves, getValidAttacks } from './engine';

function dist(a: Position, b: Position): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

export function generateAIOrders(state: GameState): Order[] {
  const aiUnits = state.units.filter(u => u.owner === 'player2');
  const orders: Order[] = [];

  for (const unit of aiUnits) {
    // Random chance to hold
    if (Math.random() < 0.1) {
      orders.push({ unitId: unit.id, type: 'hold' });
      continue;
    }

    // Try attack first
    const attacks = getValidAttacks(unit, state.units);
    if (attacks.length > 0 && Math.random() < 0.7) {
      const target = attacks[Math.floor(Math.random() * attacks.length)];
      orders.push({ unitId: unit.id, type: 'attack', target });
      continue;
    }

    // Move toward nearest uncontrolled crown city
    const moves = getValidMoves(unit, state.units);
    if (moves.length === 0) {
      orders.push({ unitId: unit.id, type: 'hold' });
      continue;
    }

    const targetCities = CROWN_CITY_POSITIONS.filter(cp => {
      const city = state.crownCities.find(c => posEqual(c.position, cp));
      return !city || city.owner !== 'player2';
    });

    if (targetCities.length > 0) {
      const nearestCity = targetCities.reduce((best, c) =>
        dist(unit.position, c) < dist(unit.position, best) ? c : best
      );
      const bestMove = moves.reduce((best, m) =>
        dist(m, nearestCity) < dist(best, nearestCity) ? m : best
      );
      orders.push({ unitId: unit.id, type: 'move', target: bestMove });
    } else {
      // Random move
      const target = moves[Math.floor(Math.random() * moves.length)];
      orders.push({ unitId: unit.id, type: 'move', target });
    }
  }

  return orders;
}
