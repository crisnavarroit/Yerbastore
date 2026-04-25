let selectedImageFile = null;
let currentProducts = [];
let currentOrders = [];

// Paginación del inventario
let inventoryPage = 1;
const INVENTORY_PER_PAGE = 10;

let fileDisplay = null;

function handleImageSelection(file) {
    if (file.type === "image/jpeg" || file.type === "image/png") {
        selectedImageFile = file;
        if (fileDisplay) fileDisplay.innerHTML = `<strong style="color:var(--primary-green)">Imagen seleccionada:</strong> ${file.name}`;
    } else {
        showToastMsg("Por favor sube solo imágenes JPG o PNG.");
        selectedImageFile = null;
        if (fileDisplay) fileDisplay.innerHTML = `Arrastra y suelta tu imagen aquí o haz clic para seleccionarla`;
    }
}

// =========================
// PRODUCTOS
// =========================
async function loadProductsFromDB() {
    try {
        const response = await fetch('get_products.php?t=' + new Date().getTime());
        const data = await response.json();

        const tbody = document.getElementById('inventory-table');
        if (!tbody) return;

        if (data.error) {
            tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">${data.error}</td></tr>`;
            return;
        }

        currentProducts = data;
        inventoryPage = 1;
        renderInventoryTable();
        renderActiveOffers();
    } catch (error) {
        const tbody = document.getElementById('inventory-table');
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="color:gray; font-weight:bold; text-align:center;">Error cargando productos.</td></tr>`;
        console.error(error);
    }
}

function filterInventoryProducts() {
    const search = (document.getElementById('inventory-search')?.value || '').toLowerCase().trim();
    const category = document.getElementById('inventory-category-filter')?.value || '';

    return currentProducts.filter(prod => {
        const matchesSearch = !search ||
            prod.name.toLowerCase().includes(search) ||
            prod.category.toLowerCase().includes(search);
        const matchesCategory = !category || prod.category === category;
        return matchesSearch && matchesCategory;
    });
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventory-table');
    const pagination = document.getElementById('inventory-pagination');
    if (!tbody) return;

    const filtered = filterInventoryProducts();
    const totalPages = Math.max(1, Math.ceil(filtered.length / INVENTORY_PER_PAGE));
    if (inventoryPage > totalPages) inventoryPage = totalPages;

    const start = (inventoryPage - 1) * INVENTORY_PER_PAGE;
    const paginated = filtered.slice(start, start + INVENTORY_PER_PAGE);

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay productos que coincidan con la búsqueda.</td></tr>`;
        if (pagination) pagination.innerHTML = '';
        return;
    }

    paginated.forEach(prod => {
        const tr = document.createElement('tr');

        let stockDisplay = `${prod.stock} ud.`;
        let stockColor = "var(--font-color)";

        if (parseInt(prod.stock) <= 0) {
            stockDisplay = "Agotado 🚨";
            stockColor = "red";
        } else if (parseInt(prod.stock) <= 5) {
            stockDisplay = `${prod.stock} ud. ⚠️ (Bajo)`;
            stockColor = "orange";
        }

        tr.innerHTML = `
            <td><input type="checkbox" class="product-checkbox" value="${prod.id}"></td>
            <td><img src="${prod.image}" alt="${prod.name}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;"></td>
            <td style="font-weight:600;">${prod.name}</td>
            <td><span style="background: var(--accent-color); padding: 0.3rem 0.6rem; border-radius: 50px; font-size: 0.8rem; color: var(--primary-green); font-weight: 700;">${prod.category}</span></td>
            <td style="font-weight:700;">
                $${parseFloat(prod.price).toLocaleString('es-AR')}
                ${prod.offer_price ? `<br><span style="color:#d84315; font-size:0.85rem;">🔥 $${parseFloat(prod.offer_price).toLocaleString('es-AR')} (${new Date(prod.offer_end_time).toLocaleString()})</span>` : ''}
            </td>
            <td style="font-weight:bold; color:${stockColor};">${stockDisplay}</td>
            <td>
                <button type="button" class="btn-action btn-edit" onclick="editProduct(${prod.id})">✏️ Editar</button>
                <button type="button" class="btn-action btn-delete" onclick="safeDeleteProduct(${prod.id})">🗑️ Borrar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Paginación
    if (pagination) {
        let html = '';
        const btnBase = `style="padding: 0.4rem 0.75rem; border-radius: 6px; border: 1px solid #d84315; cursor: pointer; font-weight: 600; transition: 0.2s;"`;
        const btnActive = `style="padding: 0.4rem 0.75rem; border-radius: 6px; border: none; background: #d84315; color: white; cursor: default; font-weight: 700;"`;

        html += `<button ${btnBase} style="padding: 0.4rem 0.75rem; border-radius: 6px; border: 1px solid #d84315; cursor: pointer; font-weight: 600; background: white; color: #d84315;" onclick="changeInventoryPage(${inventoryPage - 1})" ${inventoryPage === 1 ? 'disabled style="opacity:0.4; cursor:default;"' : ''}>‹ Ant</button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (i === inventoryPage) {
                html += `<button ${btnActive}>${i}</button>`;
            } else {
                html += `<button ${btnBase} style="padding: 0.4rem 0.75rem; border-radius: 6px; border: 1px solid #d84315; background: white; color: #d84315; cursor: pointer; font-weight: 600;" onclick="changeInventoryPage(${i})">${i}</button>`;
            }
        }

        html += `<button onclick="changeInventoryPage(${inventoryPage + 1})" ${inventoryPage === totalPages ? 'disabled style="opacity:0.4; cursor:default;"' : ''} style="padding: 0.4rem 0.75rem; border-radius: 6px; border: 1px solid #d84315; cursor: pointer; font-weight: 600; background: white; color: #d84315;">Sig ›</button>`;

        html += `<span style="color:#777; font-size: 0.85rem; margin-left: 0.5rem;">${filtered.length} producto${filtered.length !== 1 ? 's' : ''}</span>`;
        pagination.innerHTML = html;
    }
}

function changeInventoryPage(page) {
    const filtered = filterInventoryProducts();
    const totalPages = Math.max(1, Math.ceil(filtered.length / INVENTORY_PER_PAGE));
    if (page < 1 || page > totalPages) return;
    inventoryPage = page;
    const selectAllCb = document.getElementById('select-all-products');
    if (selectAllCb) selectAllCb.checked = false;
    renderInventoryTable();
}

function clearInventoryFilters() {
    document.getElementById('inventory-search').value = '';
    document.getElementById('inventory-category-filter').value = '';
    inventoryPage = 1;
    const selectAllCb = document.getElementById('select-all-products');
    if (selectAllCb) selectAllCb.checked = false;
    renderInventoryTable();
}

function setupInventoryFilters() {
    const search = document.getElementById('inventory-search');
    const category = document.getElementById('inventory-category-filter');
    if (search) {
        search.addEventListener('input', () => { inventoryPage = 1; renderInventoryTable(); });
    }
    if (category) {
        category.addEventListener('change', () => { inventoryPage = 1; renderInventoryTable(); });
    }
}

async function saveProduct(e) {
    e.preventDefault();

    const editId = document.getElementById('edit-id').value;
    const isEditing = editId !== "";

    if (!isEditing && !selectedImageFile) {
        showToastMsg("🚨 Olvidaste seleccionar la imagen del producto.");
        return;
    }

    const submitBtn = document.getElementById('btn-save');
    submitBtn.innerText = 'Guardando...';
    submitBtn.disabled = true;

    const formData = new FormData();
    if (isEditing) formData.append('id', editId);

    formData.append('name', document.getElementById('prod-name').value);
    formData.append('price', document.getElementById('prod-price').value);
    formData.append('category', document.getElementById('prod-category').value);
    formData.append('stock', document.getElementById('prod-stock').value);
    formData.append('description', document.getElementById('prod-desc').value);

    if (selectedImageFile) {
        formData.append('image', selectedImageFile);
    }

    const url = isEditing ? 'update_product.php' : 'add_product.php';

    try {
        const res = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const jsonResponse = await res.json();

        if (jsonResponse.status === "success") {
            showToastMsg(`✅ ${jsonResponse.message}`);
            cancelEdit();
            loadProductsFromDB();
        } else {
            showToastMsg(`❌ Error del servidor: ${jsonResponse.message}`);
        }
    } catch (error) {
        showToastMsg("Error de red al guardar.");
        console.error(error);
    } finally {
        submitBtn.innerText = isEditing ? 'Actualizar Producto' : 'Guardar Producto';
        submitBtn.disabled = false;
    }
}

function editProduct(id) {
    const product = currentProducts.find(p => p.id == id);
    if (!product) return;

    document.getElementById('edit-id').value = product.id;
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-price').value = parseInt(product.price);
    document.getElementById('prod-category').value = product.category;
    document.getElementById('prod-stock').value = parseInt(product.stock);
    document.getElementById('prod-desc').value = product.description;

    document.getElementById('form-title').innerText = "Editar Producto: " + product.name;
    document.getElementById('btn-save').innerText = "Actualizar Producto";
    document.getElementById('btn-cancel-edit').style.display = "inline-block";

    if (fileDisplay) {
        fileDisplay.innerHTML = `<span style="color:var(--primary-light)">Imagen actual: (Deja en blanco para conservar)</span>`;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
    document.getElementById('product-form').reset();
    document.getElementById('edit-id').value = "";
    document.getElementById('form-title').innerText = "Cargar Nuevo Producto";
    document.getElementById('btn-save').innerText = "Guardar Producto";
    document.getElementById('btn-cancel-edit').style.display = "none";

    selectedImageFile = null;
    if (fileDisplay) {
        fileDisplay.innerHTML = `Arrastra y suelta tu imagen aquí o haz clic para seleccionarla`;
    }
}

function safeDeleteProduct(id) {
    const product = currentProducts.find(p => p.id == id);
    if (!product) return;
    deleteProduct(id, product.name);
}

async function deleteProduct(id, name) {
    if (!await customConfirm(`⚠️ ¿Seguro que quieres eliminar el producto "${name}"?`)) {
        return;
    }

    try {
        const res = await fetch('delete_product.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });

        const data = await res.json();

        if (data.status === "success") {
            loadProductsFromDB();
        } else {
            showToastMsg(`Error al eliminar: ${data.message}`);
        }
    } catch (e) {
        showToastMsg("Ocurrió un error de red al intentar borrar.");
        console.error(e);
    }
}

// =========================
// PEDIDOS
// =========================
async function loadOrdersFromDB() {
    try {
        const response = await fetch('get_orders.php?t=' + new Date().getTime());
        const data = await response.json();

        if (data.status !== 'success') {
            renderOrdersTable([], data.message || 'Error al cargar pedidos.');
            return;
        }

        currentOrders = data.orders || [];
        renderOrdersTable(filterOrders(currentOrders));
    } catch (error) {
        renderOrdersTable([], 'Error al cargar pedidos.');
        console.error(error);
    }
}

function filterOrders(orders) {
    const search = (document.getElementById('filter-search')?.value || '').toLowerCase().trim();
    const status = document.getElementById('filter-status')?.value || '';
    const dateFrom = document.getElementById('filter-date-from')?.value || '';
    const dateTo = document.getElementById('filter-date-to')?.value || '';

    return orders.filter(order => {
        const name = (order.customer_name || '').toLowerCase();
        const email = (order.customer_email || '').toLowerCase();
        const address = (order.customer_address || '').toLowerCase();
        const city = (order.customer_city || '').toLowerCase();
        const province = (order.customer_province || '').toLowerCase();
        const shippingMethod = (order.shipping_method || '').toLowerCase();

        const matchesSearch =
            !search ||
            name.includes(search) ||
            email.includes(search) ||
            address.includes(search) ||
            city.includes(search) ||
            province.includes(search) ||
            shippingMethod.includes(search);

        const matchesStatus =
            !status || order.status === status;

        const orderDate = (order.created_at || '').slice(0, 10);

        const matchesDateFrom =
            !dateFrom || orderDate >= dateFrom;

        const matchesDateTo =
            !dateTo || orderDate <= dateTo;

        return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
}

function renderOrdersTable(orders, errorMessage = '') {
    const tbody = document.getElementById('orders-table');
    if (!tbody) return;

    if (errorMessage) {
        tbody.innerHTML = `<tr><td colspan="11" style="color:red; text-align:center;">${errorMessage}</td></tr>`;
        return;
    }

    if (!orders.length) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;">No hay pedidos que coincidan con los filtros.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';

    orders.forEach(order => {
        const tr = document.createElement('tr');

        const itemsHtml = order.items && order.items.length
            ? `<ul class="order-items-list">
                ${order.items.map(item => `
                    <li>
                        <strong>${item.quantity}x</strong> ${item.product_name}
                        — $${parseFloat(item.subtotal).toLocaleString('es-AR')}
                    </li>
                `).join('')}
               </ul>`
            : 'Sin detalle';

        const statusClass = order.status === 'Entregado' ? 'status-delivered' : 'status-pending';

        const orderItemsText = (order.items || [])
            .map(i => `${i.quantity}x ${i.product_name}`)
            .join(', ')
            .replace(/'/g, "\\'");

        const customerNameSafe = String(order.customer_name || '').replace(/'/g, "\\'");

        let fullAddress = '';
        if (order.shipping_method === 'Envío local') {
            fullAddress = `${order.customer_address}<br>Las Varillas, Córdoba`;
        } else {
            fullAddress = `${order.customer_address}<br>${order.customer_city}, ${order.customer_province}`;
        }

        tr.innerHTML = `
            <td><strong>#${order.id}</strong></td>
            <td><strong>${order.customer_name}</strong></td>
            <td>${order.customer_email}</td>
            <td>${order.shipping_method}</td>
            <td>${fullAddress}</td>
            <td><span class="badge-payment">${order.payment_method}</span></td>
            <td><span class="badge-status ${statusClass}">${order.status}</span></td>
            <td><strong>$${parseFloat(order.total).toLocaleString('es-AR')}</strong></td>
            <td>${order.created_at}</td>
            <td>${itemsHtml}</td>
            <td>
    ${
        order.status === 'Entregado'
            ? `
                <div style="display:flex; flex-direction:column; gap:0.5rem;">
                    <button type="button" class="btn-action btn-status" onclick="updateOrderStatus(${order.id}, 'Pendiente')">Marcar pendiente</button>
                    <button type="button" class="btn-action btn-delete" onclick="deleteOrder(${order.id}, '${customerNameSafe}', '${orderItemsText}')">🗑️ Eliminar</button>
                </div>
              `
            : `<button type="button" class="btn-action btn-status" onclick="updateOrderStatus(${order.id}, 'Entregado')">Marcar entregado</button>`
    }
</td>
        `;

        tbody.appendChild(tr);
    });
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch('update_order_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: orderId,
                status: newStatus
            })
        });

        const result = await response.json();

        if (result.status !== 'success') {
            showToastMsg(result.message);
            return;
        }

        loadOrdersFromDB();
    } catch (error) {
        showToastMsg('No se pudo actualizar el estado del pedido.');
        console.error(error);
    }
}

async function deleteOrder(orderId, customerName, orderItemsText) {
    const message = `⚠️ ¿Estás seguro que quieres eliminar el pedido #${orderId} de ${customerName}?\n\nContiene: ${orderItemsText || 'Sin detalle'}`;

    if (!await customConfirm(message)) {
        return;
    }

    try {
        const response = await fetch('delete_order.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId })
        });

        const result = await response.json();

        if (result.status !== 'success') {
            showToastMsg(result.message || 'No se pudo eliminar el pedido.');
            return;
        }

        loadOrdersFromDB();
    } catch (error) {
        showToastMsg('Ocurrió un error al eliminar el pedido.');
        console.error(error);
    }
}

function clearOrderFilters() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    renderOrdersTable(currentOrders);
}

function setupOrderFilters() {
    ['filter-search', 'filter-status', 'filter-date-from', 'filter-date-to'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                renderOrdersTable(filterOrders(currentOrders));
            });
            el.addEventListener('change', () => {
                renderOrdersTable(filterOrders(currentOrders));
            });
        }
    });
}

// =========================
// OFERTAS
// =========================
function toggleOfferInput() {
    const type = document.getElementById('offer-type').value;
    const percentEl = document.getElementById('offer-value-percent');
    const fixedEl = document.getElementById('offer-value-fixed');
    
    if (type === 'percentage') {
        percentEl.style.display = 'block';
        fixedEl.style.display = 'none';
        fixedEl.value = '';
    } else {
        percentEl.style.display = 'none';
        fixedEl.style.display = 'block';
    }
}

function toggleSelectAllProducts(checkbox) {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}

async function applyOffers() {
    const checkboxes = document.querySelectorAll('.product-checkbox:checked');
    if (checkboxes.length === 0) {
        showToastMsg("Selecciona al menos un producto.");
        return;
    }
    
    const type = document.getElementById('offer-type').value;
    let value = 0;
    
    if (type === 'percentage') {
        value = document.getElementById('offer-value-percent').value;
    } else {
        value = document.getElementById('offer-value-fixed').value;
        if (!value || value <= 0) {
            showToastMsg("Ingresa un valor válido para la oferta.");
            return;
        }
    }
    
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
    const duration = document.getElementById('offer-duration').value;
    
    try {
        const res = await fetch('apply_offers.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'apply', product_ids: ids, type, value, duration })
        });
        const data = await res.json();
        if (data.success) {
            showToastMsg("✅ Ofertas aplicadas correctamente");
            loadProductsFromDB();
        } else {
            showToastMsg("❌ Error: " + data.error);
        }
    } catch(e) {
        console.error(e);
        showToastMsg("Ocurrió un error al aplicar las ofertas.");
    }
}

async function removeOffers() {
    const checkboxes = document.querySelectorAll('.product-checkbox:checked');
    if (checkboxes.length === 0) {
        showToastMsg("Selecciona al menos un producto.");
        return;
    }
    
    if (!await customConfirm("⚠️ ¿Estás seguro que quieres quitar las ofertas de los productos seleccionados?")) {
        return;
    }

    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    try {
        const res = await fetch('apply_offers.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'remove', product_ids: ids })
        });
        const data = await res.json();
        if (data.success) {
            showToastMsg("✅ Ofertas eliminadas correctamente");
            loadProductsFromDB();
        } else {
            showToastMsg("❌ Error: " + data.error);
        }
    } catch(e) {
        console.error(e);
        showToastMsg("Ocurrió un error al quitar las ofertas.");
    }
}

async function removeSingleOffer(id) {
    if (!await customConfirm("⚠️ ¿Estás seguro que quieres quitar la oferta de este producto?")) return;
    try {
        const res = await fetch('apply_offers.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'remove', product_ids: [id] })
        });
        const data = await res.json();
        if (data.success) {
            showToastMsg("✅ Oferta eliminada correctamente");
            loadProductsFromDB();
        } else {
            showToastMsg("❌ Error: " + data.error);
        }
    } catch(e) {
        console.error(e);
        showToastMsg("Ocurrió un error al quitar la oferta.");
    }
}

function renderActiveOffers() {
    const tbody = document.getElementById('active-offers-table');
    if (!tbody) return;

    const offers = currentProducts.filter(p => p.offer_price && parseFloat(p.offer_price) > 0);

    tbody.innerHTML = '';

    if (offers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay ofertas activas en este momento.</td></tr>`;
        return;
    }

    offers.forEach(prod => {
        const tr = document.createElement('tr');

        const isExpired = new Date(prod.offer_end_time) < new Date();
        const expirationText = isExpired ? '<span style="color:red;font-weight:bold;">Expirada</span>' : new Date(prod.offer_end_time).toLocaleString();

        tr.innerHTML = `
            <td><img src="${prod.image}" alt="${prod.name}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;"></td>
            <td style="font-weight:600;">${prod.name}</td>
            <td style="text-decoration: line-through; color: #777;">$${parseFloat(prod.price).toLocaleString('es-AR')}</td>
            <td style="font-weight:700; color:#d84315;">🔥 $${parseFloat(prod.offer_price).toLocaleString('es-AR')}</td>
            <td>${expirationText}</td>
            <td>
                <button type="button" class="btn-action btn-delete" onclick="removeSingleOffer(${prod.id})">❌ Quitar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Drag and drop - inicializar aquí para que el DOM esté listo
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('prod-image');
    fileDisplay = document.getElementById('file-name-display');

    if (dropZone && fileInput && fileDisplay) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.backgroundColor = 'rgba(41, 96, 59, 0.15)';
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.backgroundColor = 'rgba(71, 140, 92, 0.05)';
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.backgroundColor = 'rgba(71, 140, 92, 0.05)';
            if (e.dataTransfer.files.length > 0) handleImageSelection(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleImageSelection(e.target.files[0]);
        });
    }

    // Inicializar toggle de ofertas y registrar evento
    toggleOfferInput();
    const offerTypeEl = document.getElementById('offer-type');
    if (offerTypeEl) offerTypeEl.addEventListener('change', toggleOfferInput);

    setupInventoryFilters();
    setupOrderFilters();
    loadProductsFromDB();
    loadOrdersFromDB();
});
function showToastMsg(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) { return; }
    toast.innerHTML = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
    }, 4500);
}

function customConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        const msgEl = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm');
        const btnCancel = document.getElementById('modal-cancel');

        if (!modal) {
            resolve(window.confirm(message));
            return;
        }

        msgEl.innerText = message;
        modal.classList.add('active');

        const cleanup = () => {
            modal.classList.remove('active');
            btnConfirm.removeEventListener('click', onConfirm);
            btnCancel.removeEventListener('click', onCancel);
        };

        const onConfirm = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };

        btnConfirm.addEventListener('click', onConfirm);
        btnCancel.addEventListener('click', onCancel);
    });
}
