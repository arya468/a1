const dbName = "story-app-db";
const dbVersion = 1;

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = (event) => {
      reject("Database error: " + event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("stories")) {
        db.createObjectStore("stories", { keyPath: "id" });
      }
    };
  });
};

const saveStory = async (story) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["stories"], "readwrite");
    const store = transaction.objectStore("stories");
    const request = store.put(story);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getStories = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["stories"], "readonly");
    const store = transaction.objectStore("stories");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteStory = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["stories"], "readwrite");
    const store = transaction.objectStore("stories");
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export { saveStory, getStories, deleteStory };
