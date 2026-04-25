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
$cartItems = $data['cartItems'] ?? [];

if (empty($cartItems) || !is_array($cartItems)) {
    echo json_encode([
        "status" => "error",
        "message" => "No se enviaron productos."
    ]);
    exit;
}

try {
    $pdo->beginTransaction();

    $selectStmt = $pdo->prepare("SELECT id, name, stock FROM products WHERE id = ?");
    $updateStmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");

    foreach ($cartItems as $item) {
        $id = isset($item['id']) ? (int)$item['id'] : 0;
        $quantity = isset($item['quantity']) ? (int)$item['quantity'] : 0;

        if ($id <= 0 || $quantity <= 0) {
            throw new Exception("Datos inválidos en el carrito.");
        }

        $selectStmt->execute([$id]);
        $product = $selectStmt->fetch();

        if (!$product) {
            throw new Exception("Uno de los productos ya no existe.");
        }

        if ((int)$product['stock'] < $quantity) {
            throw new Exception("No hay stock suficiente para: " . $product['name']);
        }

        $updateStmt->execute([$quantity, $id, $quantity]);

        if ($updateStmt->rowCount() === 0) {
            throw new Exception("No se pudo actualizar el stock de: " . $product['name']);
        }
    }

    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Stock actualizado correctamente."
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>

