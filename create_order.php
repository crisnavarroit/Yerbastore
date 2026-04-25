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

$customerName      = trim($data['customer_name'] ?? '');
$customerEmail     = trim($data['customer_email'] ?? '');
$shippingMethod    = trim($data['shipping_method'] ?? '');
$customerAddress   = trim($data['customer_address'] ?? '');
$customerCity      = trim($data['customer_city'] ?? '');
$customerProvince  = trim($data['customer_province'] ?? '');
$paymentMethod     = trim($data['payment_method'] ?? '');
$cartItems         = $data['cartItems'] ?? [];

if (
    $customerName === '' ||
    $customerEmail === '' ||
    $shippingMethod === '' ||
    $customerAddress === '' ||
    $customerCity === '' ||
    $customerProvince === '' ||
    $paymentMethod === ''
) {
    echo json_encode([
        "status" => "error",
        "message" => "Faltan datos del cliente."
    ]);
    exit;
}

if (!filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "status" => "error",
        "message" => "El email no es válido."
    ]);
    exit;
}

if (empty($cartItems) || !is_array($cartItems)) {
    echo json_encode([
        "status" => "error",
        "message" => "No se enviaron productos."
    ]);
    exit;
}

try {
    $pdo->beginTransaction();

    $selectProductStmt = $pdo->prepare("SELECT id, name, price, stock FROM products WHERE id = ?");
    $updateStockStmt   = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");

    $total = 0;
    $validatedItems = [];

    foreach ($cartItems as $item) {
        $productId = isset($item['id']) ? (int)$item['id'] : 0;
        $quantity  = isset($item['quantity']) ? (int)$item['quantity'] : 0;

        if ($productId <= 0 || $quantity <= 0) {
            throw new Exception("Hay productos inválidos en el carrito.");
        }

        $selectProductStmt->execute([$productId]);
        $product = $selectProductStmt->fetch();

        if (!$product) {
            throw new Exception("Uno de los productos ya no existe.");
        }

        if ((int)$product['stock'] < $quantity) {
            throw new Exception("No hay stock suficiente para: " . $product['name']);
        }

        $price = (float)$product['price'];
        $subtotal = $price * $quantity;
        $total += $subtotal;

        $validatedItems[] = [
            'product_id'   => (int)$product['id'],
            'product_name' => $product['name'],
            'price'        => $price,
            'quantity'     => $quantity,
            'subtotal'     => $subtotal
        ];
    }

    $insertOrderStmt = $pdo->prepare("
        INSERT INTO orders (
            customer_name,
            customer_email,
            shipping_method,
            customer_address,
            customer_city,
            customer_province,
            payment_method,
            total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $insertOrderStmt->execute([
        $customerName,
        $customerEmail,
        $shippingMethod,
        $customerAddress,
        $customerCity,
        $customerProvince,
        $paymentMethod,
        $total
    ]);

    $orderId = (int)$pdo->lastInsertId();

    $insertOrderItemStmt = $pdo->prepare("
        INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            price,
            quantity,
            subtotal
        ) VALUES (?, ?, ?, ?, ?, ?)
    ");

    foreach ($validatedItems as $item) {
        $insertOrderItemStmt->execute([
            $orderId,
            $item['product_id'],
            $item['product_name'],
            $item['price'],
            $item['quantity'],
            $item['subtotal']
        ]);

        $updateStockStmt->execute([
            $item['quantity'],
            $item['product_id'],
            $item['quantity']
        ]);

        if ($updateStockStmt->rowCount() === 0) {
            throw new Exception("No se pudo actualizar el stock de: " . $item['product_name']);
        }
    }

    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Pedido registrado correctamente.",
        "order_id" => $orderId
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
