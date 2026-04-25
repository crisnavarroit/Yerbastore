<?php
header('Content-Type: application/json');
require_once 'conexion.php';

try {
    $stmt = $pdo->query("
        SELECT 
            id,
            customer_name,
            customer_email,
            shipping_method,
            customer_address,
            customer_city,
            customer_province,
            payment_method,
            total,
            status,
            created_at
        FROM orders
        ORDER BY id DESC
    ");

    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $itemsStmt = $pdo->prepare("
        SELECT 
            product_name,
            unit_price AS price,
            quantity,
            subtotal
        FROM order_items
        WHERE order_id = ?
        ORDER BY id ASC
    ");

    foreach ($orders as &$order) {
        $itemsStmt->execute([$order['id']]);
        $order['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        "status" => "success",
        "orders" => $orders
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "No se pudieron recuperar los pedidos: " . $e->getMessage()
    ]);
}
?>

