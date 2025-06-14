(
    function () {
        if(window.location.pathname !== '/') {
            console.log('Wrong Page');
            return;
        }
        const APPCONFIG = {
            API_URL: "https://gist.githubusercontent.com/sevindi/8bcbde9f02c1d4abe112809c974e1f49/raw/9bf93b58df623a9b16f1db721cd0a7a539296cf0/products.json",
            LOCAL_STORAGE_PRODUCTS_KEY: "products",
            LOCAL_STORAGE_FAVORITES_KEY: "favorites",
        }
        
        class Utils {
            static formatPrice(price) {
                return price.toFixed(2).replace('.', ',') + " TL";
            }
        }

        class DataRepository {

            async fetchProducts() {
                let products = JSON.parse(localStorage.getItem(APPCONFIG.LOCAL_STORAGE_PRODUCTS_KEY)) || [];
                if(products.length === 0) {
                    const response = await fetch(APPCONFIG.API_URL);
                    const data = await response.json();
                    products = data;
                    localStorage.setItem(APPCONFIG.LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(products));
                }
                return products;
            }

            async fetchFavorites() {
                let favorites = JSON.parse(localStorage.getItem(APPCONFIG.LOCAL_STORAGE_FAVORITES_KEY)) || [];
                return favorites;
            }
            
            async toggleProductFavoriteStatus(product) {
                let favorites = await this.fetchFavorites();
                if(!favorites.some(p => p.id === product.id)) {
                    favorites.push(product);
                    localStorage.setItem(APPCONFIG.LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(favorites));
                }else{
                    favorites = favorites.filter(p => p.id !== product.id);
                    localStorage.setItem(APPCONFIG.LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(favorites));
                }
                return favorites;
            }

            
            async fetchProductsAndFavorites() {
                const [products, favorites] = await Promise.all([
                    this.fetchProducts(),
                    this.fetchFavorites()
                ]);
                return [products, favorites];
            }
        }
    
        class ProductCarousel {
            constructor(containerSelecter, dataRepository){
                this.container = document.querySelector(containerSelecter);
                if(!this.container) {
                    console.error(`Container not found: ${containerSelecter}`);
                    return;
                }
                this.dataRepository = dataRepository;
                this.products = [];
                this.favorites = [];

                this.currentIndex = 0;
                this.itemsVisible = 4;
            }
            
            async _loadData(){
                const [products, favorites] = await this.dataRepository.fetchProductsAndFavorites();
                this.products = products;
                this.favorites = favorites;
                this._render();
                this._setupEventListeners();
                this._updateButtonState();
            }
            
            _buildCSS() {
                const css = `
                    .banner__wrapper {
                        position: relative;
                    }
                    .carousel-container {
                        overflow: hidden;
                    }
                    .carousel-track {
                        display: flex;
                        transition: transform 0.25s ease-in-out;
                    }
                    .carousel-item {
                        padding: 0 10px;
                        box-sizing: border-box;
                    }
                    
                `;
                const style = document.createElement('style');
                style.textContent = css;
                document.head.appendChild(style);
            }
            
            _render(){
                this._buildCSS();
                const carouselHTML = `
                <eb-product-carousel style="margin-top: 20px;">
                    <div class="banner">
                        <div class="container">
                            <eb-carousel-header>
                                <div class="banner__titles">
                                    <h2 class="title-primary">Beğenebileceğinizi düşündüklerimiz</h2>
                                </div>
                            </eb-carousel-header>
                            <div class="banner__wrapper">
                                <div class="carousel-container">
                                    <div class="carousel-track"></div>
                                </div>
                                <button aria-label="back" class="swiper-prev"></button>
                                <button aria-label="next" class="swiper-next"></button>
                            </div>
                        </div>
                    </div>
                </eb-product-carousel>
                `;
                this.container.innerHTML = carouselHTML;
                this.track = this.container.querySelector('.carousel-track');
                this.products.forEach(product => {
                    const card = this._createProductCard(product);
                    this.track.appendChild(card);
                });
                this._updateItemsVisible();
                this._updateCarouselPosition();
            }

            _createProductCard(product){
                const item = document.createElement('div');
                item.className = 'carousel-item';
                const isFavorite = this.favorites.some(p => p.id === product.id);


                const hasDiscount = product.original_price > product.price;
                let discountPercent = 0;
                if (hasDiscount) {
                    discountPercent = Math.round(((product.original_price - product.price) / product.original_price) * 100);
                }


                item.innerHTML = `
                    <div class="product-item">
                        <eb-generic-link class="product-item-anchor" event-collection="true">
                            <a class="product-item-anchor ng-star-inserted" href="${product.url}" target="_blank">
                                <figure class="product-item__img ng-star-inserted">
                                    <cx-media alt="${product.name}" format="product" class="is-initialized">
                                        <img class="ng-star-inserted ls-is-cached lazyloaded product-image" alt="${product.name}" src="${product.img}">
                                    </cx-media>
                                </figure>
                                <div class="product-item-content ng-star-inserted">
                                    <eb-generic-link class="product-item-anchor">
                                        <a class="product-item-anchor ng-star-inserted" href="${product.url}" target="_blank">
                                            <h2 class="product-item__brand ng-star-inserted">
                                                <b>${product.brand}</b><span> - ${product.name}</span>
                                            </h2>
                                            <div class="d-flex mb-2 stars-wrapper align-items-center ng-star-inserted">
                                                <cx-star-rating disabled="true">
                                                    <cx-icon class="star cx-icon fas fa-star ng-star-inserted"></cx-icon>
                                                    <cx-icon class="star cx-icon fas fa-star ng-star-inserted"></cx-icon>
                                                    <cx-icon class="star cx-icon fas fa-star ng-star-inserted"></cx-icon>
                                                    <cx-icon class="star cx-icon fas fa-star ng-star-inserted"></cx-icon>
                                                    <cx-icon class="star cx-icon fas fa-star ng-star-inserted"></cx-icon>
                                                </cx-star-rating>
                                            </div>
                                        </a>
                                    </eb-generic-link>
                                    <div class="product-item__price-container">
                                        <div class="d-flex align-items-center ng-star-inserted" style="margin-top: 5px; min-height: 21px;">
                                            ${hasDiscount ? 
                                                `<div class="product-item__old-price">${Utils.formatPrice(product.original_price)}</div>
                                                 <span class="product-item__percent ml-2">%${discountPercent} <i class="icon icon-decrease"></i></span>` 
                                                : ''
                                            }
                                        </div>
                                        <span class="product-item__new-price ${hasDiscount ? 'discount-product' : ''}">${Utils.formatPrice(product.price)}</span>
                                    </div>
                                </div>
                                <div class="product-list-promo ng-star-inserted"></div>
                            </a>
                        </eb-generic-link>
                            <button class="add-to-favorites-btn">
                                ${this._injectHeartIcon(isFavorite)}
                            </button>
                        <div class="product-item-content">
                            <div class="product-item__price">
                                <div class="ins-add-to-cart-wrapper">
                                    <button id="addToLocalStorage"  class="btn close-btn">Sepete Ekle</button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                const heartButton = item.querySelector('.add-to-favorites-btn');
                

                heartButton.setAttribute('data-product-id', product.id);
                
                heartButton.addEventListener('click', async () => {
                    this.favorites = await this.dataRepository.toggleProductFavoriteStatus(product);
                    this.isFavorite = this.favorites.some(p => p.id === product.id);
                    heartButton.innerHTML = this._injectHeartIcon(this.isFavorite);
                });
                return item;
            }

            _injectHeartIcon(isFavorite){
                return isFavorite ? `
                    <div class="heart ng-star-inserted">
                        <img src="assets/svg/added-favorite.svg" alt="heart fill" class="heart-icon">
                        <img src="assets/svg/added-favorite-hover.svg" alt="heart fill" class="heart-icon hovered">
                        <div class="toolbox">
                            <div class="toolbox-triangle"></div>
                            <span>Listelerimi güncelle</span>
                        </div>
                    </div>
                ` : `
                    <div class="heart ng-star-inserted" >
                        <img id="default-favorite" src="assets/svg/default-favorite.svg" alt="heart" class="heart-icon">
                        <img src="assets/svg/default-hover-favorite.svg" alt="heart" class="heart-icon hovered">
                        <div class="toolbox">
                            <div class="toolbox-triangle"></div>
                            <span>Listelerime ekle</span>
                        </div>
                    </div>
                `}

            _setupEventListeners(){
                this.prevBtn = this.container.querySelector('.swiper-prev');
                this.nextBtn = this.container.querySelector('.swiper-next');

                this.prevBtn.addEventListener('click', () => {
                    this.currentIndex = Math.max(this.currentIndex - 1, 0);
                    this._updateCarouselPosition();
                });

                this.nextBtn.addEventListener('click', () => {
                    const maxIndex = this.products.length - this.itemsVisible;
                    this.currentIndex = Math.min(this.currentIndex + 1, maxIndex);
                    this._updateCarouselPosition();
                });

                window.addEventListener('resize', () => {
                    this._updateItemsVisible();
                    this._updateCarouselPosition();
                });
            }

            _updateItemsVisible() {
                if (window.innerWidth <= 600) {
                    this.itemsVisible = 1;
                } else if (window.innerWidth <= 992) {
                    this.itemsVisible = 2;
                } else if (window.innerWidth <= 1200) {
                    this.itemsVisible = 3;
                } else {
                    this.itemsVisible = 4;
                }

                if (this.track) {
                    const itemWidthPercent = 100 / this.itemsVisible;
                    const items = this.track.querySelectorAll('.carousel-item');
                    items.forEach(item => {
                        item.style.flex = `0 0 ${itemWidthPercent}%`;
                        item.style.maxWidth = `${itemWidthPercent}%`;
                    });
                }
                
                const maxIndex = this.products.length - this.itemsVisible;
                if (this.currentIndex > maxIndex) {
                    this.currentIndex = Math.max(maxIndex, 0);
                }
            }

            _updateCarouselPosition() {
                if (!this.track || !this.track.querySelector('.carousel-item')) return;
                const itemWidth = this.track.querySelector('.carousel-item').getBoundingClientRect().width;
                const offset = -this.currentIndex * itemWidth;
                this.track.style.transform = `translateX(${offset}px)`;
                this._updateButtonState();
            }

            _updateButtonState() {
                if (!this.prevBtn || !this.nextBtn) return;
                const maxIndex = this.products.length - this.itemsVisible;
                this.prevBtn.disabled = this.currentIndex === 0;
                this.nextBtn.disabled = this.currentIndex >= maxIndex;
            }

            async init() {
                await this._loadData();
            }
        }

        async function injectCarousel() {
            try {
                const xpath = "/html/body/eb-root/cx-storefront/main/cx-page-layout/cx-page-slot[2]";
                const targetElement = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

                const carouselContainer = document.createElement('div');
                carouselContainer.id = 'injected-carousel';
                carouselContainer.className = 'injected-carousel-container';
                
                targetElement.parentNode.insertBefore(carouselContainer, targetElement);
    
                const dataRepository = new DataRepository();
                const productCarousel = new ProductCarousel('#injected-carousel', dataRepository);
                await productCarousel.init();
                
            } catch (error) {
                console.error('Failed to inject carousel:', error);
            }
        }
    
        injectCarousel();
    })();

