export function createStore() {
  const state = new Map();
  const subs = new Map();
  return {
    get(key, fallback) {
      return state.has(key) ? state.get(key) : fallback;
    },
    set(key, value) {
      state.set(key, value);
      (subs.get(key) || []).forEach((fn) => fn(value));
    },
    on(key, fn) {
      if (!subs.has(key)) subs.set(key, []);
      subs.get(key).push(fn);
      return () => {
        const list = subs.get(key);
        if (list) list.splice(list.indexOf(fn), 1);
      };
    },
  };
}

export const store = createStore();