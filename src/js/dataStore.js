import fs from "node:fs";

class DataStore {
  constructor() {
    if (!DataStore.instance) {
      this.cache = new Map();
      DataStore.instance = this;
    }

    return DataStore.instance;
  }

  setTable(tableName, records) {
    this.cache.set(tableName, records);
  }

  getTable(tableName) {
    return this.cache.get(tableName) || [];
  }

  hasTable(tableName) {
    return this.cache.has(tableName);
  }

  clear() {
    this.cache.clear();
  }
}

const instance = new DataStore();
Object.freeze(instance);
export default instance;
