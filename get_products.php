<?php
// get_products.php
// Este archivo lee los productos y se los envía a JavaScript en formato JSON
header('Content-Type: application/json');
header("Cache-Control: no-cache, no-store, must-revalidate"); // HTTP 1.1.
header("Pragma: no-cache"); // HTTP 1.0.
header("Expires: 0"); // Proxies.
require_once 'conexion.php';

try {
    $stmt = $pdo->query('SELECT id, name, category, price, stock, description, image, offer_price, offer_end_time FROM products');
    $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($productos);
} catch (Exception $e) {
    echo json_encode(['error' => 'No se pudieron recuperar los productos.']);
}
?>