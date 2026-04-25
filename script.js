let cart = [];
let storeProducts = [];
let filteredProducts = [];
let visibleProductsCount = 12;

// Formatear moneda
function formatMoney(amount) {
    return '$' + parseFloat(amount).toLocaleString('es-AR');
}

// Añadir producto al carrito
function addToCart(id, name, price, btn = null) {
    const product = storeProducts.find(p => parseInt(p.id) === parseInt(id));

    if (!product) {
        alert("No se encontró el producto.");
        return;
    }

    const currentQtyInCart =
        cart.find(item => parseInt(item.id) === parseInt(id))?.quantity || 0;

    if (currentQtyInCart >= parseInt(product.stock)) {
        alert("No podés agregar más unidades de las disponibles en stock.");
        return;
    }

    const existingItem = cart.find(item => parseInt(item.id) === parseInt(id));

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }

    updateCartUI();

    if (btn) {
        const originalText = btn.innerText;
        btn.innerText = "¡Agregado! ✔";
        btn.style.backgroundColor = "#C8600D";
        btn.style.color = "white";

        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = "";
            btn.style.color = "";
        }, 1500);
    }
}

// Eliminar producto del carrito
function removeFromCart(id) {
    cart = cart.filter(item => parseInt(item.id) !== parseInt(id));
    updateCartUI();
}

// Cambiar cantidad dentro del carrito
function updateQuantity(id, change) {
    const item = cart.find(item => parseInt(item.id) === parseInt(id));
    if (!item) return;

    if (change > 0) {
        const product = storeProducts.find(p => parseInt(p.id) === parseInt(id));
        if (!product) { alert("No se encontró el producto."); return; }
        if (item.quantity >= parseInt(product.stock)) {
            alert("No hay más stock disponible para este producto.");
            return;
        }
    }

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(id);
    } else {
        updateCartUI();
    }
}

// Actualizar UI del carrito
function updateCartUI() {
    const cartCount       = document.getElementById('cart-count');
    const cartItemsDiv    = document.getElementById('cart-items');
    const cartTotalPrice  = document.getElementById('cart-total-price');
    const checkoutForm    = document.getElementById('checkout-form');
    const paymentStep     = document.getElementById('payment-step');

    if (!cartCount || !cartItemsDiv || !cartTotalPrice || !checkoutForm || !paymentStep) return;

    checkoutForm.style.display = 'flex';
    paymentStep.style.display  = 'none';

    let totalItems = 0;
    let totalPrice = 0;

    cartItemsDiv.innerHTML = '';

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p class="empty-cart">Tu carrito está vacío 🧉</p>';
        checkoutForm.style.display = 'none';
        cartCount.innerText = '0';
        cartCount.classList.remove('active');
        cartTotalPrice.innerText = '$0';
        return;
    }

    cart.forEach(item => {
        totalItems += item.quantity;
        totalPrice += item.price * item.quantity;

        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <div class="item-info">
                <h4>${item.name}</h4>
                <div class="item-price">${formatMoney(item.price)} C/U</div>
            </div>
            <div class="item-actions">
                <button onclick="updateQuantity(${item.id}, -1)">−</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
        `;
        cartItemsDiv.appendChild(itemEl);
    });

    cartCount.innerText = totalItems;
    cartCount.classList.add('active');
    cartTotalPrice.innerText = formatMoney(totalPrice);
}

// Abrir/cerrar carrito
function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (!sidebar || !overlay) return;
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
}

function handleShippingMethodChange() {
    const shippingMethod = document.getElementById('shipping-method')?.value || '';
    const localFields = document.getElementById('local-shipping-fields');
    const correoFields = document.getElementById('correo-shipping-fields');
    const localAddress = document.getElementById('customer-address-local');
    const correoAddress = document.getElementById('customer-address-correo');
    const city = document.getElementById('customer-city');
    const province = document.getElementById('customer-province');

    if (!localFields || !correoFields) return;

    const isLocal = shippingMethod === 'Envío local';
    const isCorreo = shippingMethod === 'Correo Argentino';

    localFields.style.display = isLocal ? 'block' : 'none';
    correoFields.style.display = isCorreo ? 'block' : 'none';

    if (localAddress) {
        localAddress.required = isLocal;
        if (!isLocal) localAddress.value = '';
    }
    if (correoAddress) {
        correoAddress.required = isCorreo;
        if (!isCorreo) correoAddress.value = '';
    }
    if (city) {
        city.required = isCorreo;
        if (!isCorreo) city.value = '';
    }
    if (province) {
        province.required = isCorreo;
        if (!isCorreo) province.value = '';
    }
}

// Enviar a WhatsApp
async function sendToWhatsapp() {
    const name           = document.getElementById('customer-name')?.value.trim() || '';
    const email          = document.getElementById('customer-email')?.value.trim() || '';
    const shippingMethod = document.getElementById('shipping-method')?.value || '';
    const localAddress   = document.getElementById('customer-address-local')?.value.trim() || '';
    const correoAddress  = document.getElementById('customer-address-correo')?.value.trim() || '';
    const cityInput      = document.getElementById('customer-city')?.value.trim() || '';
    const provinceInput  = document.getElementById('customer-province')?.value.trim() || '';
    const paymentMethod  = document.getElementById('payment-method')?.value || '';

    let customerAddress = '';
    let customerCity = '';
    let customerProvince = '';

    if (!name || !email || !shippingMethod || !paymentMethod) {
        alert("Por favor completá todos los datos antes de continuar.");
        return;
    }

    if (shippingMethod === 'Envío local') {
        if (!localAddress) {
            alert("Por favor ingresá la dirección de entrega en Las Varillas, Córdoba.");
            return;
        }
        customerAddress = localAddress;
        customerCity = 'Las Varillas';
        customerProvince = 'Córdoba';
    } else if (shippingMethod === 'Correo Argentino') {
        if (!correoAddress || !cityInput || !provinceInput) {
            alert("Por favor completá dirección, pueblo/localidad y provincia.");
            return;
        }
        customerAddress = correoAddress;
        customerCity = cityInput;
        customerProvince = provinceInput;
    } else {
        alert("Por favor seleccioná un tipo de envío.");
        return;
    }

    if (cart.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    let orderDetails = `*¡Hola Yerba Store!* \n`;
    orderDetails += `Soy ${name} y realicé el siguiente pedido desde la web:\n\n`;

    let total = 0;
    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        orderDetails += ` ${item.quantity}x ${item.name} (${formatMoney(subtotal)})\n`;
    });

    orderDetails += `\n*Total a pagar:* ${formatMoney(total)}\n`;
    orderDetails += `*Nombre:* ${name}\n`;
    orderDetails += `*Email:* ${email}\n`;
    orderDetails += `*Tipo de envío:* ${shippingMethod}\n`;

    if (shippingMethod === 'Envío local') {
        orderDetails += `*Dirección de entrega:* ${customerAddress}\n`;
        orderDetails += `*Ubicación:* Las Varillas, Córdoba\n`;
    } else {
        orderDetails += `*Dirección:* ${customerAddress}\n`;
        orderDetails += `*Localidad / Pueblo:* ${customerCity}\n`;
        orderDetails += `*Provincia:* ${customerProvince}\n`;
    }

    orderDetails += `*Método de pago:* ${paymentMethod}\n\n`;

    if (paymentMethod === "Mercado Pago") {
        orderDetails += `*Acabo de generar el pago al Alias YerbaStore.lv*\n`;
        orderDetails += `Te adjunto abajo la imagen de mi comprobante. ¡Gracias! `;
    } else {
        orderDetails += `Voy a abonar en efectivo al recibir mi pedido. ¡Muchas gracias! `;
    }

    const whatsappNumber = "5493533510874";
    const whatsappURL    = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderDetails)}`;

    const btnContinue        = document.getElementById('btn-continue');
    const btnConfirmWhatsapp = document.getElementById('btn-confirm-whatsapp');
    if (btnContinue)        btnContinue.disabled        = true;
    if (btnConfirmWhatsapp) btnConfirmWhatsapp.disabled = true;

    try {
        const response = await fetch('create_order.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_name:     name,
                customer_email:    email,
                shipping_method:   shippingMethod,
                customer_address:  customerAddress,
                customer_city:     customerCity,
                customer_province: customerProvince,
                payment_method:    paymentMethod,
                cartItems:         cart
            })
        });

        const result = await response.json();

        if (result.status !== "success") {
            alert("No se pudo registrar el pedido: " + result.message);
            return;
        }

        window.open(whatsappURL, '_blank');

        cart = [];
        updateCartUI();

        const cartSidebar = document.getElementById('cart-sidebar');
        if (cartSidebar?.classList.contains('open')) toggleCart();

        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) checkoutForm.reset();

        handleShippingMethodChange();

        setTimeout(loadStoreProducts, 500);

    } catch (error) {
        alert("Ocurrió un error al registrar el pedido. Intentá nuevamente.");
        console.error(error);
    } finally {
        if (btnContinue)        btnContinue.disabled        = false;
        if (btnConfirmWhatsapp) btnConfirmWhatsapp.disabled = false;
    }
}

// Poblar filtro de categorías
function populateCategoryFilter(products) {
    const categorySelect = document.getElementById('category-filter');
    if (!categorySelect) return;

    const categories = [...new Set(
        products
            .map(p => (p.category || '').trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'es'));

    categorySelect.innerHTML = `<option value="">Todas las categorías</option>`;

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

function applyFilters(resetVisibleCount = true) {
    const searchValue   = (document.getElementById('search-filter')?.value || '').toLowerCase().trim();
    const categoryValue = document.getElementById('category-filter')?.value || '';

    filteredProducts = storeProducts.filter(prod => {
        const name        = (prod.name || '').toLowerCase();
        const description = (prod.description || '').toLowerCase();
        const category    = (prod.category || '');

        const matchesSearch =
            searchValue === '' ||
            name.includes(searchValue) ||
            description.includes(searchValue) ||
            category.toLowerCase().includes(searchValue);

        const matchesCategory =
            categoryValue === '' || category === categoryValue;

        return matchesSearch && matchesCategory;
    });

    if (resetVisibleCount) visibleProductsCount = 12;

    renderStoreProducts();
}

function renderStoreProducts() {
    const grid        = document.getElementById('main-product-grid');
    const loadMoreBtn = document.getElementById('load-more-btn');

    if (!grid) return;

    grid.innerHTML = '';

    if (!filteredProducts.length) {
        grid.innerHTML = '<p style="text-align:center; color:var(--font-muted); grid-column:1/-1; font-weight:bold; font-size:1.1rem;">No se encontraron productos con esos filtros. 🧉</p>';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }

    const productsToShow = filteredProducts.slice(0, visibleProductsCount);

    productsToShow.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const safeName = String(prod.name || '').replace(/'/g, "\\'");
        const safeCat  = prod.category || 'Producto';
        const safeDesc = prod.description || '';
        const prId     = parseInt(prod.id);

        const isOutOfStock = parseInt(prod.stock) <= 0;
        const btnText   = isOutOfStock ? "Agotado 🚫" : "Agregar al carrito";
        const btnClass  = isOutOfStock ? "btn-cart disabled" : "btn-cart";
        
        let hasOffer = false;
        let finalPrice = parseFloat(prod.price);
        if (prod.offer_price && prod.offer_end_time) {
            const now = new Date();
            const end = new Date(prod.offer_end_time.replace(' ', 'T'));
            if (end > now) {
                hasOffer = true;
                finalPrice = parseFloat(prod.offer_price);
            }
        }

        const btnAction = isOutOfStock
            ? ""
            : `onclick="addToCart(${prId}, '${safeName}', ${finalPrice}, this)"`;

        let priceHtml = `<span class="price">${formatMoney(finalPrice)}</span>`;
        if (hasOffer) {
            priceHtml = `
                <div style="display:flex; flex-direction:column; align-items:flex-start;">
                    <span style="text-decoration: line-through; color: red; font-size: 0.85rem; margin-bottom:-4px;">${formatMoney(parseFloat(prod.price))}</span>
                    <span class="price" style="color: #d84315;">${formatMoney(finalPrice)}</span>
                </div>
            `;
        }


        card.innerHTML = `
            <div class="img-wrapper" style="${isOutOfStock ? 'opacity:0.45;' : ''}">
                <img src="${prod.image}" alt="${safeName}" loading="lazy">
            </div>
            <div class="product-info">
                <span class="category">${safeCat}</span>
                <h3>${safeName}</h3>
                <p>${safeDesc}</p>
                <div class="product-footer">
                    ${priceHtml}
                    <button class="${btnClass}" ${btnAction} style="${isOutOfStock ? 'background:#444; color:#888; cursor:not-allowed;' : ''}">
                        ${btnText}
                    </button>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });

    if (loadMoreBtn) {
        loadMoreBtn.style.display = filteredProducts.length > visibleProductsCount ? 'inline-block' : 'none';
    }
}

function setupStoreFilters() {
    const searchInput    = document.getElementById('search-filter');
    const categorySelect = document.getElementById('category-filter');
    const clearBtn       = document.getElementById('clear-filters-btn');
    const loadMoreBtn    = document.getElementById('load-more-btn');

    if (searchInput) searchInput.addEventListener('input', () => applyFilters(true));
    if (categorySelect) categorySelect.addEventListener('change', () => applyFilters(true));

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (categorySelect) categorySelect.value = '';
            applyFilters(true);
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            visibleProductsCount += 12;
            renderStoreProducts();
        });
    }
}

async function loadStoreProducts() {
    const grid = document.getElementById('main-product-grid');
    if (!grid) return;

    try {
        const res      = await fetch('get_products.php?t=' + new Date().getTime());
        const products = await res.json();

        storeProducts    = Array.isArray(products) ? products : [];
        filteredProducts = [...storeProducts];

        if (products.error || !Array.isArray(products) || products.length === 0) {
            grid.innerHTML = '<p style="text-align:center; color:var(--font-muted); grid-column:1/-1; font-weight:bold; font-size:1.1rem;">Aún no hay productos disponibles. Revisá más tarde. 🧉</p>';
            return;
        }

        populateCategoryFilter(storeProducts);
        applyFilters(true);
        renderOffers();

    } catch (error) {
        console.error("Error al cargar productos", error);
        grid.innerHTML = '<p style="text-align:center; color:#e74c3c; grid-column:1/-1; font-weight:bold;">Error al cargar productos. 🚫</p>';
    }
}

// ================== OFERTAS FUNCTIONS ==================
let offerInterval = null;

function renderOffers() {
    const section = document.getElementById('ofertas');
    const grid = document.getElementById('offers-product-grid');
    if (!section || !grid) return;

    const now = new Date();
    const activeOffers = storeProducts.filter(prod => {
        if (!prod.offer_price || !prod.offer_end_time) return false;
        const endTime = new Date(prod.offer_end_time.replace(' ', 'T'));
        return endTime > now;
    });

    if (activeOffers.length === 0) {
        section.style.display = 'none';
        if (offerInterval) clearInterval(offerInterval);
        return;
    }

    section.style.display = 'block';
    grid.innerHTML = '';

    activeOffers.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card offer-card';
        card.style.border = '2px solid #d84315';
        card.style.position = 'relative';

        const safeName = String(prod.name || '').replace(/'/g, "\\'");
        const safeDesc = prod.description || '';
        const safeCat  = prod.category || '';
        const prId     = parseInt(prod.id);

        const isOutOfStock = parseInt(prod.stock) <= 0;
        const btnText   = isOutOfStock ? "Agotado 🚫" : "Lo quiero!";
        const btnClass  = isOutOfStock ? "btn-cart disabled" : "btn-cart";
        const btnAction = isOutOfStock
            ? ""
            : `onclick="addToCart(${prId}, '${safeName}', ${parseFloat(prod.offer_price)}, this)"`;

        const endTimeStr = prod.offer_end_time.replace(' ', 'T');

        card.innerHTML = `
            <div class="offer-badge" style="position:absolute; top:10px; right:10px; background:#d84315; color:white; padding:5px 12px; border-radius:8px; font-weight:bold; z-index:2; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                ⏳ <span class="countdown-timer" data-end="${endTimeStr}">Calculando...</span>
            </div>
            <div class="img-wrapper" style="${isOutOfStock ? 'opacity:0.45;' : ''}">
                <img src="${prod.image}" alt="${safeName}" loading="lazy">
            </div>
            <div class="product-info">
                <span class="category">${safeCat}</span>
                <h3>${safeName}</h3>
                <div class="product-footer" style="margin-top:1rem;">
                    <div style="display:flex; flex-direction:column;">
                        <span style="text-decoration: line-through; color: red; font-size: 0.95rem; margin-bottom:-4px;">${formatMoney(parseFloat(prod.price))}</span>
                        <span class="price" style="color: #d84315; font-size:1.4rem;">${formatMoney(parseFloat(prod.offer_price))}</span>
                    </div>
                    <button class="${btnClass}" ${btnAction} style="background: #d84315; color:white; border-radius:6px; border:none; padding:10px 15px; cursor:pointer; font-weight:bold;" ${isOutOfStock ? 'disabled' : ''}>
                        ${btnText}
                    </button>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });

    if (offerInterval) clearInterval(offerInterval);
    offerInterval = setInterval(updateCountdowns, 1000);
    updateCountdowns();
    
    setTimeout(startOffersCarousel, 100);
}

function updateCountdowns() {
    const timers = document.querySelectorAll('.countdown-timer');
    const now = new Date();
    let hasEnded = false;
    
    timers.forEach(timer => {
        const end = new Date(timer.getAttribute('data-end'));
        const diff = end - now;

        if (diff <= 0) {
            timer.innerHTML = "Terminada";
            hasEnded = true;
        } else {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);
            timer.innerHTML = `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        }
    });
    
    if (hasEnded) {
        // Debounce reload
        setTimeout(loadStoreProducts, 2000);
    }
}

let carouselAnimation;
function startOffersCarousel() {
    const grid = document.getElementById('offers-product-grid');
    if (!grid) return;
    
    if (carouselAnimation) cancelAnimationFrame(carouselAnimation);
    
    let isInteracting = false;
    let scrollPos = grid.scrollLeft;
    
    // Pause auto-scroll on interaction
    grid.addEventListener('mouseenter', () => isInteracting = true);
    grid.addEventListener('mouseleave', () => { isInteracting = false; scrollPos = grid.scrollLeft; });
    grid.addEventListener('touchstart', () => isInteracting = true, {passive: true});
    grid.addEventListener('touchend', () => { isInteracting = false; scrollPos = grid.scrollLeft; });
    grid.addEventListener('scroll', () => {
        if(isInteracting) scrollPos = grid.scrollLeft;
    }, {passive:true});

    function step() {
        if (!isInteracting && grid.scrollWidth > grid.clientWidth) {
            scrollPos += 0.5; // Muy lento
            if (scrollPos >= (grid.scrollWidth - grid.clientWidth)) {
                scrollPos = 0; // Vuelve al principio
            }
            grid.scrollLeft = scrollPos;
        } else {
            scrollPos = grid.scrollLeft;
        }
        carouselAnimation = requestAnimationFrame(step);
    }
    carouselAnimation = requestAnimationFrame(step);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    const checkoutForm       = document.getElementById('checkout-form');
    const btnBackCart        = document.getElementById('btn-back-cart');
    const btnConfirmWhatsapp = document.getElementById('btn-confirm-whatsapp');
    const shippingMethod     = document.getElementById('shipping-method');

    if (shippingMethod) {
        shippingMethod.addEventListener('change', handleShippingMethodChange);
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const paymentMethod = document.getElementById('payment-method')?.value || '';

            if (cart.length === 0) {
                alert("El carrito está vacío.");
                return;
            }

            const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

            if (paymentMethod === "Mercado Pago") {
                checkoutForm.style.display = 'none';
                const paymentStep   = document.getElementById('payment-step');
                const paymentAmount = document.getElementById('payment-amount');
                if (paymentStep) paymentStep.style.display = 'flex';
                if (paymentAmount) paymentAmount.innerText = formatMoney(total);
            } else {
                sendToWhatsapp();
            }
        });
    }

    if (btnBackCart) {
        btnBackCart.addEventListener('click', function() {
            const checkoutForm = document.getElementById('checkout-form');
            const paymentStep  = document.getElementById('payment-step');
            if (checkoutForm) checkoutForm.style.display = 'flex';
            if (paymentStep) paymentStep.style.display = 'none';
        });
    }

    if (btnConfirmWhatsapp) {
        btnConfirmWhatsapp.addEventListener('click', function() {
            sendToWhatsapp();
        });
    }

    handleShippingMethodChange();
    setupStoreFilters();
    loadStoreProducts();
});
