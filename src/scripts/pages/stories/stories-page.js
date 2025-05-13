import StoryPresenter from "./story-presenter";
import { showFormattedDate } from "../../utils";
import MapHelper from "../../utils/map-helper";

class StoriesPage {
  #presenter = null;
  #map = null;
  #markers = [];

  constructor() {
    this.#presenter = new StoryPresenter(this);
  }

  async render() {
    return `      
      <section id="mainContent" class="stories container" tabindex="-1">
        <h1 class="stories__title">Lihat Cerita</h1>
        
        <div id="offlineMessage" class="offline-message" style="display: none;">
          <i class="fas fa-wifi-slash"></i> Anda sedang offline. Menampilkan data dari penyimpanan lokal.
        </div>
        
        <div id="stories" class="stories__list"></div>
        
        <div class="stories__pagination">
          <button id="prevPage" class="pagination-button"><i class="fas fa-chevron-left"></i> Sebelumnya</button>
          <span id="pageInfo" class="pagination-info">Halaman 1</span>
          <button id="nextPage" class="pagination-button">Selanjutnya <i class="fas fa-chevron-right"></i></button>
        </div>
        
        <div id="map" class="stories__map"></div>
        
        <a href="#/stories/add" class="floating-button" aria-label="Tambah cerita baru">
          <i class="fas fa-plus"></i>
        </a>
      </section>
    `;
  }

  async afterRender() {
    await this.#presenter.init();
    await this.#presenter.loadStories();

    const prevButton = document.getElementById("prevPage");
    const nextButton = document.getElementById("nextPage");
    const pageInfo = document.getElementById("pageInfo");

    prevButton.addEventListener("click", () => {
      const currentPage = parseInt(pageInfo.textContent.split(" ")[1]);
      if (currentPage > 1) {
        this.#presenter.setPage(currentPage - 1);
      }
    });

    nextButton.addEventListener("click", () => {
      const currentPage = parseInt(pageInfo.textContent.split(" ")[1]);
      this.#presenter.setPage(currentPage + 1);
    });

    const storiesContainer = document.querySelector("#stories");
    const mapContainer = document.querySelector("#map");

    // Initialize map in non-interactive mode
    this.#map = MapHelper.initMap(mapContainer, false);

    const loadStories = async (page) => {
      try {
        const result = await this.#presenter.loadStories(page);
        if (!result) return;

        const { stories, hasMore, currentPage } = result;
        storiesContainer.innerHTML = "";

        this.#markers.forEach((marker) => marker.remove());
        this.#markers = [];

        stories.forEach((story) => {
          storiesContainer.innerHTML += this._createStoryCard(story);

          if (story.lat && story.lon) {
            const marker = MapHelper.addMarker(
              this.#map,
              story.lat,
              story.lon,
              this._createPopupContent(story)
            );
            this.#markers.push(marker);
          }
        });

        prevButton.disabled = currentPage === 1;
        nextButton.disabled = !hasMore;
        pageInfo.textContent = `Halaman ${currentPage}`;
      } catch (error) {
        console.error(error);
        storiesContainer.innerHTML =
          '<div class="error-message">Gagal memuat cerita</div>';
      }
    };

    // Initialize first page
    await loadStories(1);

    // Ensure focus management if coming from skip link
    const mainContent = document.getElementById("mainContent");
    if (mainContent && window.location.hash === "#mainContent") {
      mainContent.focus();
    }
  }

  showStories(stories) {
    const storiesContainer = document.getElementById("stories");
    storiesContainer.innerHTML = stories
      .map((story) => this._createStoryCard(story))
      .join("");
  }

  showOfflineMessage() {
    const offlineMessage = document.getElementById("offlineMessage");
    offlineMessage.style.display = "block";
  }

  showError(message) {
    const storiesContainer = document.getElementById("stories");
    storiesContainer.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        ${message}
      </div>
    `;
  }

  _createStoryCard(story) {
    return `
      <article class="story-item">
        <img src="${story.photoUrl}" alt="Foto dari ${
      story.name
    }" class="story-item__image">
        <div class="story-item__content">
          <h2 class="story-item__title">${story.name}</h2>
          <p class="story-item__description">${story.description}</p>
          <p class="story-item__date">
            <i class="far fa-calendar-alt"></i> ${showFormattedDate(
              story.createdAt
            )}
          </p>
          <a href="#/stories/${story.id}" class="read-more-button">
            Selengkapnya <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      </article>
    `;
  }

  _createPopupContent(story) {
    return `
      <div class="popup-content">
        <h3>${story.name}</h3>
        <img src="${story.photoUrl}" alt="Foto dari ${story.name}" style="max-width: 200px;">
        <p>${story.description}</p>
      </div>
    `;
  }

  async destroy() {
    if (this.#map) {
      this.#map.remove();
      this.#map = null;
    }
  }
}

export default StoriesPage;
