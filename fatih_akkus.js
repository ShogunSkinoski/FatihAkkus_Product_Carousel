(
    function () {



        const APPCONFIG = {
            API_URL: "https://gist.githubusercontent.com/sevindi/8bcbde9f02c1d4abe112809c974e1f49/raw/9bf93b58df623a9b16f1db721cd0a7a539296cf0/products.json",
            LOCAL_STORAGE_PRODUCTS_KEY: "products",
            LOCAL_STORAGE_FAVORITES_KEY: "favorites",
        }

        let products = JSON.parse(localStorage.getItem(APPCONFIG.LOCAL_STORAGE_PRODUCTS_KEY)) || [];
        let favorites = JSON.parse(localStorage.getItem(APPCONFIG.LOCAL_STORAGE_FAVORITES_KEY)) || [];

        const utils = {
        undefined
        }

        const dataRepository = {
            async fetchProducts() {
                if(products.length === 0) {
                    const response = await fetch(APPCONFIG.API_URL);
                    const data = await response.json();
                    products = data;
                    localStorage.setItem(APPCONFIG.LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(products));
                }
                return products;
            }

        }

        async function init() {
            await dataRepository.fetchProducts();
            console.log(products);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }
)();