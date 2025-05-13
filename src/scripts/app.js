import Navigation from "./pages/navigation";
import HomePage from "./pages/home-page";
import StoriesPage from "./pages/stories/stories-page";
import AddStoryPage from "./pages/stories/add-story-page";
import DetailStoryPage from "./pages/stories/detail-story-page";
import LoginPage from "./pages/auth/login-page";
import RegisterPage from "./pages/auth/register-page";
import AboutPage from "./pages/about-page";

class App {
  constructor() {
    this._init();
  }

  _init() {
    // Initialize navigation
    this._navigation = new Navigation();

    // Initialize pages
    this._pages = {
      "/": new HomePage(),
      "/stories": new StoriesPage(),
      "/stories/add": new AddStoryPage(),
      "/login": new LoginPage(),
      "/register": new RegisterPage(),
      "/about": new AboutPage(),
    };

    // Initialize router
    this._initRouter();
  }

  _initRouter() {
    window.addEventListener("hashchange", () => {
      this._renderPage();
    });

    window.addEventListener("load", () => {
      this._renderPage();
    });
  }

  async _renderPage() {
    const mainContent = document.querySelector("#main-content");
    const hash = window.location.hash.slice(1).toLowerCase();
    const page = this._pages[hash] || this._pages["/"];

    try {
      mainContent.innerHTML = await page.render();
      await page.afterRender();
    } catch (error) {
      console.error("Error rendering page:", error);
      mainContent.innerHTML =
        '<div class="error-message">Failed to load page</div>';
    }
  }
}

// Initialize app
const app = new App();
