class DataStore {
  constructor() {
    if (!DataStore.instance) {
      this.cache = new Map();
      this.tableNames = [];
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

  setTables(tableNames) {
    this.tableNames.length = 0;
    if (Array.isArray(tableNames)) {
      this.tableNames.push(...tableNames);
    }
  }

  getTables() {
    return [...this.tableNames];
  }

  hasTable(tableName) {
    return this.cache.has(tableName);
  }

  clear() {
    this.cache.clear();
    this.tableNames.length = 0;
  }
}

const instance = new DataStore();
Object.freeze(instance);
export default instance;
