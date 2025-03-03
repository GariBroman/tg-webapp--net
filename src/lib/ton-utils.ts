/**
 * Форматирует значение в нанотонах в читаемый формат TON
 * @param nanotons Количество нанотонов
 * @returns Отформатированное значение в TON
 */
export function formatNanoTon(nanotons: number | bigint): string {
  const value = Number(nanotons) / 1e9;
  return value.toFixed(2);
}

/**
 * Форматирует адрес TON в удобочитаемый формат
 */
export function formatTonAddress(address: string): string {
  if (!address) return "";
  
  // Если адрес длиннее 10 символов, сокращаем его
  if (address.length > 10) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  
  return address;
}

// Конвертация TON в наноTON
export function toNano(tons: number): bigint {
  return BigInt(Math.floor(tons * 1e9));
}

// Конвертация наноTON в TON
export function fromNano(nanotons: bigint): number {
  return Number(nanotons) / 1e9;
} 