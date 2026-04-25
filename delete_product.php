<?php
// delete_product.php
// Este archivo elimina un producto de la base de datos
header('Content-Type: application/json');
require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obtenemos el ID del producto que llega en el body
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;

    if ($id) {
        try {
            // Primero, buscamos si tiene una imagen para eliminarla del servidor
            $stmt = $pdo->prepare('SELECT image FROM products WHERE id = ?');
            $stmt->execute([$id]);
            $product = $stmt->fetch();

            // Si la imagen existe y no es la de por defecto, la borramos del servidor
            if ($product && file_exists($product['image']) && $product['image'] !== 'images/default.jpg') {
                unlink($product['image']);
            }

            // Ahora sí, lo borramos de la base de datos
            $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
            $stmt->execute([$id]);

            echo json_encode(["status" => "success", "message" => "Producto eliminado correctamente."]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Error al eliminar de la BD: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "ID de producto no proporcionado."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Método no permitido"]);
}
?>
