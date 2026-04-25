<?php
header('Content-Type: application/json');
require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        "status" => "error",
        "message" => "Método no permitido."
    ]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$orderId = isset($data['order_id']) ? (int)$data['order_id'] : 0;
$newStatus = trim($data['status'] ?? '');

$allowedStatuses = ['Pendiente', 'Entregado'];

if ($orderId <= 0) {
    echo json_encode([
        "status" => "error",
        "message" => "ID de pedido inválido."
    ]);
    exit;
}

if (!in_array($newStatus, $allowedStatuses, true)) {
    echo json_encode([
        "status" => "error",
        "message" => "Estado inválido."
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->execute([$newStatus, $orderId]);

    echo json_encode([
        "status" => "success",
        "message" => "Estado actualizado correctamente."
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "No se pudo actualizar el estado: " . $e->getMessage()
    ]);
}
?>
