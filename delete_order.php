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

if ($orderId <= 0) {
    echo json_encode([
        "status" => "error",
        "message" => "ID de pedido inválido."
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
    $stmt->execute([$orderId]);

    echo json_encode([
        "status" => "success",
        "message" => "Pedido eliminado correctamente."
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "No se pudo eliminar el pedido: " . $e->getMessage()
    ]);
}
?>