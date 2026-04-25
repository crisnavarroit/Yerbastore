<?php
session_start();
if (!isset($_SESSION['admin_logged']) || $_SESSION['admin_logged'] !== true) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}
require_once 'conexion.php';
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['product_ids']) || !is_array($data['product_ids']) || count($data['product_ids']) === 0) {
    echo json_encode(['success' => false, 'error' => 'No products selected']);
    exit;
}

$ids = $data['product_ids'];
$action = $data['action'] ?? 'apply';

try {
    if ($action === 'remove') {
        $stmt = $pdo->prepare("UPDATE products SET offer_price = NULL, offer_end_time = NULL WHERE id = ?");
        foreach ($ids as $id) {
            $stmt->execute([$id]);
        }
    } else {
        $type = $data['type'] ?? 'percentage';
        $value = (float)($data['value'] ?? 0);
        $duration = (int)($data['duration'] ?? 24);
        
        $endTime = date('Y-m-d H:i:s', strtotime("+$duration hours"));
        
        $stmt_price = $pdo->prepare("SELECT id, price FROM products WHERE id = ?");
        $stmt_update = $pdo->prepare("UPDATE products SET offer_price = ?, offer_end_time = ? WHERE id = ?");
        
        foreach ($ids as $id) {
            if ($type === 'percentage') {
                $stmt_price->execute([$id]);
                $prod = $stmt_price->fetch();
                if ($prod) {
                    $basePrice = (float)$prod['price'];
                    $discount = $basePrice * ($value / 100);
                    $newPrice = $basePrice - $discount;
                    if ($newPrice < 0) $newPrice = 0;
                    $stmt_update->execute([$newPrice, $endTime, $id]);
                }
            } else {
                $stmt_update->execute([$value, $endTime, $id]);
            }
        }
    }
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
