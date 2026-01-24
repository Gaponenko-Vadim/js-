/**
 * Fisher-Yates shuffle algorithm
 * Перемешивает массив случайным образом
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Перемешивает варианты ответа и обновляет индекс правильного ответа
 */
export function shuffleOptions(options: string[], correctAnswer: number): {
  shuffledOptions: string[];
  newCorrectAnswer: number;
} {
  // Создаем массив с индексами
  const indexedOptions = options.map((option, index) => ({
    option,
    originalIndex: index,
  }));

  // Перемешиваем
  const shuffled = shuffleArray(indexedOptions);

  // Находим новую позицию правильного ответа
  const newCorrectAnswer = shuffled.findIndex(
    (item) => item.originalIndex === correctAnswer
  );

  return {
    shuffledOptions: shuffled.map((item) => item.option),
    newCorrectAnswer,
  };
}
