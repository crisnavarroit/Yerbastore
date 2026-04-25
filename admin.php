<?php
session_start();

if (!isset($_SESSION['admin_logged']) || $_SESSION['admin_logged'] !== true) {
    header('Location: login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración | Yerba Store</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="admin.css?v=<?php echo time(); ?>">
</head>
<body>
    <div class="admin-container" id="admin-dashboard">
        <div class="admin-header">
            <div>
                <h1 style="color: #d84315; margin-bottom: 0.4rem; font-family: 'Outfit', sans-serif;">Panel de Control</h1>
                <p style="margin:0; color: #555;">Gestión de inventario y pedidos para Yerba Store 🧉</p>
                <p style="margin-top:0.4rem; color: #777;">
                    Sesión iniciada como:
                    <strong><?php echo htmlspecialchars($_SESSION['admin_user'] ?? 'admin'); ?></strong>
                </p>
            </div>

            <div style="display:flex; gap:0.8rem; flex-wrap:wrap;">
                <a href="index.html" class="btn-secondary" style="padding: 0.6rem 1rem;">Volver a la Web</a>
                <a href="logout.php" class="btn-primary" style="padding: 0.6rem 1rem;">Cerrar sesión</a>
            </div>
        </div>

        <div class="admin-card">
            <h2 id="form-title" style="margin-bottom: 1.5rem;">Cargar Nuevo Producto</h2>

            <form id="product-form" onsubmit="saveProduct(event)">
                <input type="hidden" id="edit-id" value="">

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <div class="form-group">
                        <label>Nombre del Producto</label>
                        <input type="text" id="prod-name" placeholder="Ej: Yerba Canarias 1kg" required>
                    </div>

                    <div class="form-group">
                        <label>Precio ($ ARS)</label>
                        <input type="number" id="prod-price" placeholder="Ej: 8500" required>
                    </div>

                    <div class="form-group">
                        <label>Categoría</label>
                        <select id="prod-category" required>
                           <option value="Mates">Mates</option>
                            <option value="Yerbas">Yerbas</option>
                            <option value="Accesorios">Accesorios</option>
                            <option value="Termos">Termos</option>
                            <option value="Bombillas">Bombillas</option>
                            <option value="Bombillones">Bombillones</option>
                            <option value="Kits Materos">Kits Materos</option>
                            <option value="Promos">Promos</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Stock Disponible</label>
                        <input type="number" id="prod-stock" placeholder="Ej: 20" required>
                    </div>
                </div>

                <div class="form-group" style="margin-top: 1rem;">
                    <label>Sube la Imagen del Producto (Solo si quieres cambiarla)</label>
                    <div id="drop-zone" style="border: 2px dashed #d84315; padding: 1.5rem; text-align: center; border-radius: 8px; background: rgba(216, 67, 21, 0.05); transition: 0.3s; cursor: pointer;">
                        <p style="color: #666; margin-bottom: 0.5rem" id="file-name-display">
                            Arrastra y suelta tu imagen aquí o haz clic para seleccionarla
                        </p>
                        <input type="file" id="prod-image" accept="image/png, image/jpeg" style="display: none;">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('prod-image').click()" style="padding: 0.5rem 1rem; font-size: 0.9rem;">
                            Elegir Archivo
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <label>Descripción Corta</label>
                    <textarea id="prod-desc" rows="2" placeholder="Excelente yerba despalada..." required></textarea>
                </div>

                <div style="display: flex; gap: 1rem;">
                    <button type="submit" id="btn-save" class="btn-primary">Guardar Producto</button>
                    <button type="button" id="btn-cancel-edit" class="btn-secondary" style="display: none;" onclick="cancelEdit()">Cancelar Edición</button>
                </div>
            </form>
        </div>

        <div class="admin-card">
            <h2 style="margin-bottom: 1rem;">Ofertas Activas 🔥</h2>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Imagen</th>
                            <th>Nombre</th>
                            <th>Precio Original</th>
                            <th>Precio Oferta</th>
                            <th>Vence</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="active-offers-table">
                        <tr>
                            <td colspan="6" style="text-align:center;">Cargando ofertas... ⏳</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="admin-card">
            <h2 style="margin-bottom: 1rem;">Inventario Actual</h2>

            <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.2rem; flex-wrap: wrap;">
                <input type="text" id="inventory-search" placeholder="Buscar producto por nombre o categoría..."
                    style="flex: 1; min-width: 200px; padding: 0.7rem 1rem; border: 1px solid #cbd5e1; border-radius: 8px; font-family: 'Inter', sans-serif; color: #1a1a1a; background: #fff;">
                <select id="inventory-category-filter" style="padding: 0.7rem 1rem; border: 1px solid #cbd5e1; border-radius: 8px; font-family: 'Inter', sans-serif; color: #1a1a1a; background: #fff;">
                    <option value="">Todas las categorías</option>
                    <option value="Mates">Mates</option>
                    <option value="Yerbas">Yerbas</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Termos">Termos</option>
                    <option value="Bombillas">Bombillas</option>
                    <option value="Bombillones">Bombillones</option>
                    <option value="Kits Materos">Kits Materos</option>
                    <option value="Promos">Promos</option>
                </select>
                <button type="button" class="btn-secondary" onclick="clearInventoryFilters()" style="padding: 0.7rem 1rem; height: 44px;">Limpiar</button>
            </div>

            <div style="background: rgba(216, 67, 21, 0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1.2rem; border: 1px dashed #d84315;">
                <h3 style="margin-top:0; margin-bottom: 0.8rem; font-size:1.1rem; color:#d84315;">🔥 Gestionar Ofertas de Productos Seleccionados</h3>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
                    <div class="form-group" style="margin-bottom:0; flex:1; min-width: 150px;">
                        <label>Tipo de Descuento</label>
                        <select id="offer-type" style="height: 48px;">
                            <option value="percentage">Porcentaje (%)</option>
                            <option value="fixed">Precio Fijo ($)</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0; flex:1; min-width: 120px;">
                        <label>Valor</label>
                        <select id="offer-value-percent" style="height: 48px;">
                            <option value="5">5%</option>
                            <option value="10">10%</option>
                            <option value="15">15%</option>
                            <option value="20">20%</option>
                            <option value="25">25%</option>
                            <option value="30">30%</option>
                            <option value="40">40%</option>
                            <option value="50">50%</option>
                        </select>
                        <input type="number" id="offer-value-fixed" placeholder="Ej: 8000" style="height: 48px; display: none;">
                    </div>
                    <div class="form-group" style="margin-bottom:0; flex:1; min-width: 120px;">
                        <label>Duración</label>
                        <select id="offer-duration" style="height: 48px;">
                            <option value="12">12 horas</option>
                            <option value="24" selected>24 horas</option>
                            <option value="48">48 horas</option>
                            <option value="72">72 horas</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex:2;">
                        <button type="button" class="btn-primary" onclick="applyOffers()" style="flex:1; height: 48px;">Aplicar Oferta</button>
                        <button type="button" class="btn-secondary" onclick="removeOffers()" style="flex:1; height: 48px;">Quitar Oferta</button>
                    </div>
                </div>
            </div>

            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px;"><input type="checkbox" id="select-all-products" onchange="toggleSelectAllProducts(this)"></th>
                            <th>Imagen</th>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="inventory-table"></tbody>
                </table>
            </div>

            <div id="inventory-pagination" style="display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-top: 1.2rem; flex-wrap: wrap;"></div>
        </div>

        <div class="admin-card">
            <h2 style="margin-bottom: 1rem;">Pedidos Realizados</h2>

            <div class="filters-grid">
                <div class="form-group" style="margin-bottom:0;">
                    <label for="filter-search">Buscar</label>
                    <input type="text" id="filter-search" placeholder="Nombre, email, localidad o provincia">
                </div>

                <div class="form-group" style="margin-bottom:0;">
                    <label for="filter-status">Estado</label>
                    <select id="filter-status">
                        <option value="">Todos</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Entregado">Entregado</option>
                    </select>
                </div>

                <div class="form-group" style="margin-bottom:0;">
                    <label for="filter-date-from">Desde</label>
                    <input type="date" id="filter-date-from">
                </div>

                <div class="form-group" style="margin-bottom:0;">
                    <label for="filter-date-to">Hasta</label>
                    <input type="date" id="filter-date-to">
                </div>

                <button type="button" class="btn-secondary" onclick="clearOrderFilters()" style="height: 44px;">
                    Limpiar
                </button>
            </div>

            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Pedido</th>
                            <th>Cliente</th>
                            <th>Contacto</th>
                            <th>Envío</th>
                            <th>Dirección</th>
                            <th>Pago</th>
                            <th>Estado</th>
                            <th>Total</th>
                            <th>Fecha</th>
                            <th>Productos</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody id="orders-table">
                        <tr>
                            <td colspan="11" style="text-align:center;">Cargando pedidos... ⏳</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div id="toast-notification" style="
        position: fixed;
        top: 20px;
        right: 20px;
        min-width: 280px;
        max-width: 360px;
        background: #d84315;
        color: white;
        padding: 1rem 1.2rem;
        border-radius: 14px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.18);
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        z-index: 9999;
        opacity: 0;
        transform: translateY(-20px);
        pointer-events: none;
        transition: all 0.35s ease;
    ">
        🧉 Nuevo pedido recibido
    </div>

    <div id="custom-modal" class="modal-overlay">
        <div class="modal-content">
            <h3 id="modal-title" style="margin-top:0; color:#d84315; font-family:'Outfit',sans-serif;">⚠️ Confirmación</h3>
            <p id="modal-message" style="margin: 1.5rem 0; color:#444; font-size:1.05rem; line-height: 1.5;"></p>
            <div style="display:flex; gap:1rem; margin-top: 1.5rem;">
                <button type="button" class="btn-secondary" style="flex:1; height:48px;" id="modal-cancel">Cancelar</button>
                <button type="button" class="btn-primary" style="flex:1; height:48px;" id="modal-confirm">Aceptar</button>
            </div>
        </div>
    </div>

    <script src="admin.js?v=<?php echo time(); ?>"></script>
</body>
</html>


