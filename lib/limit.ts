/** File d'attente simple : au plus `max` tâches en parallèle (compression + envoi des photos sur mobile). */
export function createLimiter(max: number) {
  let active = 0;
  const waiting: (() => void)[] = [];
  const next = () => {
    if (active >= max) return;
    const run = waiting.shift();
    if (run) run();
  };
  return function limit<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      waiting.push(() => {
        active++;
        task().then(resolve, reject).finally(() => {
          active--;
          next();
        });
      });
      next();
    });
  };
}
