const DB_NAME = 'CustomerDB';
const DB_VERSION = 2;
const STORE_NAME = 'customers';

class CustomerDatabase {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          objectStore.createIndex('name', 'name', { unique: false });
          objectStore.createIndex('email', 'email', { unique: false });
          objectStore.createIndex('phone', 'phone', { unique: false });
          objectStore.createIndex('age', 'age', { unique: false });
          objectStore.createIndex('score', 'score', { unique: false });
          objectStore.createIndex('lastMessageAt', 'lastMessageAt', { unique: false });
          objectStore.createIndex('addedBy', 'addedBy', { unique: false });
        } else if (oldVersion < 2) {
          const transaction = event.target.transaction;
          const objectStore = transaction.objectStore(STORE_NAME);
          
          if (!objectStore.indexNames.contains('age')) {
            objectStore.createIndex('age', 'age', { unique: false });
          }
          
          objectStore.clear();
        }
      };
    });
  }

  async bulkAdd(customers) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      customers.forEach(customer => {
        objectStore.add(customer);
      });
    });
  }

  async getCount() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getCustomers(offset, limit) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.openCursor();

      const results = [];
      let skipCount = 0;

      request.onerror = () => reject(request.error);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor && results.length < limit) {
          if (skipCount >= offset) {
            results.push(cursor.value);
          } else {
            skipCount++;
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });
  }

  async searchCustomers(searchTerm, offset, limit) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.openCursor();

      const results = [];
      const lowerSearchTerm = searchTerm.toLowerCase();
      let skipCount = 0;

      request.onerror = () => reject(request.error);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor && results.length < limit) {
          const customer = cursor.value;
          const nameMatch = customer.name.toLowerCase().includes(lowerSearchTerm);
          const emailMatch = customer.email.toLowerCase().includes(lowerSearchTerm);
          const phoneMatch = customer.phone.includes(lowerSearchTerm);

          if (nameMatch || emailMatch || phoneMatch) {
            if (skipCount >= offset) {
              results.push(customer);
            } else {
              skipCount++;
            }
          }
          
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });
  }

  async getCustomersSorted(field, order = 'asc', offset, limit) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      let request;
      if (objectStore.indexNames.contains(field)) {
        const index = objectStore.index(field);
        request = index.openCursor(null, order === 'desc' ? 'prev' : 'next');
      } else {
        request = objectStore.openCursor();
      }

      const results = [];
      let skipCount = 0;

      request.onerror = () => reject(request.error);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor && results.length < limit) {
          if (skipCount >= offset) {
            results.push(cursor.value);
          } else {
            skipCount++;
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });
  }

  async searchAndSort(searchTerm, sortField, sortOrder, offset, limit) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.openCursor();

      const results = [];
      const lowerSearchTerm = searchTerm.toLowerCase();

      request.onerror = () => reject(request.error);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          const customer = cursor.value;
          const nameMatch = customer.name.toLowerCase().includes(lowerSearchTerm);
          const emailMatch = customer.email.toLowerCase().includes(lowerSearchTerm);
          const phoneMatch = customer.phone.includes(lowerSearchTerm);

          if (nameMatch || emailMatch || phoneMatch) {
            results.push(customer);
          }
          
          cursor.continue();
        } else {
          results.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];
            
            if (typeof aVal === 'string') {
              aVal = aVal.toLowerCase();
              bVal = bVal.toLowerCase();
            }
            
            if (sortOrder === 'asc') {
              return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
              return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
          });

          const paginatedResults = results.slice(offset, offset + limit);
          resolve({ results: paginatedResults, total: results.length });
        }
      };
    });
  }

  async clear() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export default new CustomerDatabase();