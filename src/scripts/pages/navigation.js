import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribePushNotification,
  unsubscribePushNotification,
} from "../notification";

class Navigation {
  constructor() {
    this._init();
  }

  _init() {
    this._renderNavigation();
    this._initNotificationButton();
  }

  _renderNavigation() {
    const navList = document.querySelector("#nav-list");
    const token = localStorage.getItem("token");

    navList.innerHTML = `
      <ul class="nav-list">
        <li><a href="#/" class="nav-link">Home</a></li>
        <li><a href="#/stories" class="nav-link">Stories</a></li>
        ${
          token
            ? `
          <li><a href="#/stories/add" class="nav-link">Add Story</a></li>
          <li><button id="notificationButton" class="notification-button">
            <i class="fas fa-bell"></i> Subscribe
          </button></li>
          <li><a href="#" class="nav-link" id="logoutButton">Logout</a></li>
        `
            : `
          <li><a href="#/login" class="nav-link">Login</a></li>
          <li><a href="#/register" class="nav-link">Register</a></li>
        `
        }
      </ul>
    `;

    if (token) {
      const logoutButton = document.querySelector("#logoutButton");
      logoutButton.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        window.location.hash = "#/login";
      });
    }
  }

  async _initNotificationButton() {
    const notificationButton = document.querySelector("#notificationButton");
    if (!notificationButton) return;

    // Check initial subscription status
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      this._updateButtonState(notificationButton, true);
    }

    notificationButton.addEventListener("click", async () => {
      try {
        const isSubscribed =
          notificationButton.classList.contains("subscribed");

        if (!isSubscribed) {
          // Subscribe
          await requestNotificationPermission();
          const registration = await navigator.serviceWorker.ready;
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

          this._updateButtonState(notificationButton, true);
          this._showToast("Successfully subscribed to notifications!");
        } else {
          // Unsubscribe
          const registration = await navigator.serviceWorker.ready;
          await unsubscribePushNotification(registration);

          // Send unsubscribe to server
          const token = localStorage.getItem("token");
          if (token) {
            const subscription =
              await registration.pushManager.getSubscription();
            if (subscription) {
              await fetch(
                "https://story-api.dicoding.dev/v1/notifications/subscribe",
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ endpoint: subscription.endpoint }),
                }
              );
            }
          }

          this._updateButtonState(notificationButton, false);
          this._showToast("Successfully unsubscribed from notifications!");
        }
      } catch (error) {
        console.error("Error handling notification subscription:", error);
        this._showToast("Failed to update notification subscription", true);
      }
    });
  }

  _updateButtonState(button, isSubscribed) {
    if (isSubscribed) {
      button.innerHTML = '<i class="fas fa-bell"></i> Unsubscribe';
      button.classList.add("subscribed");
    } else {
      button.innerHTML = '<i class="fas fa-bell"></i> Subscribe';
      button.classList.remove("subscribed");
    }
  }

  _showToast(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = `toast ${isError ? "toast--error" : "toast--success"}`;
    toast.innerHTML = `
      <i class="fas ${
        isError ? "fa-exclamation-circle" : "fa-check-circle"
      }"></i>
      ${message}
    `;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add("show"), 100);

    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

export default Navigation;
