const subscribers = new Set<() => void>();

export function subscribeAuthChanges(subscriber: () => void) {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}

export function notifyAuthChanged() {
  subscribers.forEach((subscriber) => subscriber());
}
