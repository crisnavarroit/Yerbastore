<?php
header('Content-Type: application/json');
require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        "status" => "error",
        "message" => "Método no permitido"
    ]);
    exit;
}

$id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
$name = trim($_POST['name'] ?? '');
$price = isset($_POST['price']) ? (float)$_POST['price'] : 0;
$category = trim($_POST['category'] ?? '');
$stock = isset($_POST['stock']) ? (int)$_POST['stock'] : 0;
$desc = trim($_POST['description'] ?? '');

if ($id <= 0) {
    echo json_encode([
        "status" => "error",
        "message" => "Falta el ID del producto."
    ]);
    exit;
}

if ($name === '' || $category === '') {
    echo json_encode([
        "status" => "error",
        "message" => "Nombre y categoría son obligatorios."
    ]);
    exit;
}

if ($price < 0) {
    echo json_encode([
        "status" => "error",
        "message" => "El precio no puede ser negativo."
    ]);
    exit;
}

if ($stock < 0) {
    echo json_encode([
        "status" => "error",
        "message" => "El stock no puede ser negativo."
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT image FROM products WHERE id = ?");
    $stmt->execute([$id]);
    $oldProduct = $stmt->fetch();

    if (!$oldProduct) {
        echo json_encode([
            "status" => "error",
            "message" => "El producto no existe."
        ]);
        exit;
    }

    $hasNewImage = isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK;
    $imagePath = $oldProduct['image'];

    if ($hasNewImage) {
        $uploadDir = 'images/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $tmpName = $_FILES['image']['tmp_name'];
        $originalName = $_FILES['image']['name'];
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        $allowedExtensions = ['jpg', 'jpeg', 'png'];

        if (!in_array($extension, $allowedExtensions)) {
            echo json_encode([
                "status" => "error",
                "message" => "Formato de imagen no permitido. Solo JPG, JPEG o PNG."
            ]);
            exit;
        }

        $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
        $fileName = time() . '_' . $safeName . '.' . $extension;
        $targetFilePath = $uploadDir . $fileName;

        if (!move_uploaded_file($tmpName, $targetFilePath)) {
            echo json_encode([
                "status" => "error",
                "message" => "No se pudo guardar la nueva imagen."
            ]);
            exit;
        }

        $imagePath = $targetFilePath;

        if (!empty($oldProduct['image']) && $oldProduct['image'] !== 'images/default.jpg' && file_exists($oldProduct['image'])) {
            unlink($oldProduct['image']);
        }
    }

    $sql = "UPDATE products
            SET name = ?, category = ?, price = ?, stock = ?, description = ?, image = ?
            WHERE id = ?";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$name, $category, $price, $stock, $desc, $imagePath, $id]);

    echo json_encode([
        "status" => "success",
        "message" => "Producto actualizado exitosamente."
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Ocurrió un error al actualizar la BD: " . $e->getMessage()
    ]);
}
?>


