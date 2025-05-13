import StoryAPI from "../../data/api";
import { saveStory, getStories, deleteStory } from "../../db";
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribePushNotification,
} from "../../notification";

class StoryPresenter {
  #view = null;
  #stories = [];
  #currentPage = 1;
  #pageSize = 10;

  constructor(view) {
    this.#view = view;
  }

  async init() {
    try {
      // Register service worker and request notification permission
      const registration = await registerServiceWorker();
      await requestNotificationPermission();

      // Subscribe to push notifications
      const subscription = await subscribePushNotification(registration);

      // Send subscription to server
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(
          "https://story-api.dicoding.dev/v1/notifications/subscribe",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(subscription),
          }
        );
      }
    } catch (error) {
      console.error("Error initializing story presenter:", error);
    }
  }

  async loadStories() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token not found");
      }

      // Try to get stories from API first
      const response = await StoryAPI.getStories(token, {
        page: this.#currentPage,
        size: this.#pageSize,
      });

      if (response.error) {
        throw new Error(response.message);
      }

      // Save stories to IndexedDB
      for (const story of response.listStory) {
        await saveStory(story);
      }

      this.#stories = response.listStory;
      this.#view.showStories(this.#stories);
    } catch (error) {
      console.error("Error loading stories:", error);

      // If API fails, try to load from IndexedDB
      try {
        const offlineStories = await getStories();
        this.#stories = offlineStories;
        this.#view.showStories(this.#stories);
        this.#view.showOfflineMessage();
      } catch (dbError) {
        console.error("Error loading stories from IndexedDB:", dbError);
        this.#view.showError("Gagal memuat cerita");
      }
    }
  }

  async addStory(description, photo, location) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token not found");
      }

      const response = await StoryAPI.addStory(
        {
          description,
          photo,
          lat: location?.lat,
          lon: location?.lng,
        },
        token
      );

      if (response.error) {
        throw new Error(response.message);
      }

      // Save the new story to IndexedDB
      const newStory = {
        id: response.id,
        description,
        photoUrl: URL.createObjectURL(photo),
        createdAt: new Date().toISOString(),
        lat: location?.lat,
        lon: location?.lng,
      };
      await saveStory(newStory);

      return response;
    } catch (error) {
      console.error("Error adding story:", error);
      throw error;
    }
  }

  async deleteStory(id) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token not found");
      }

      // Delete from IndexedDB
      await deleteStory(id);

      // Delete from API
      const response = await fetch(
        `https://story-api.dicoding.dev/v1/stories/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete story");
      }

      return true;
    } catch (error) {
      console.error("Error deleting story:", error);
      throw error;
    }
  }

  setPage(page) {
    this.#currentPage = page;
    this.loadStories();
  }
}

export default StoryPresenter;
