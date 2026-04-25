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

$name = trim($_POST['name'] ?? '');
$price = isset($_POST['price']) ? (float)$_POST['price'] : 0;
$category = trim($_POST['category'] ?? '');
$stock = isset($_POST['stock']) ? (int)$_POST['stock'] : 0;
$desc = trim($_POST['description'] ?? '');

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

$uploadDir = 'images/';
$imagePath = 'images/default.jpg';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
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

    if (move_uploaded_file($tmpName, $targetFilePath)) {
        $imagePath = $targetFilePath;
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "No se pudo guardar la imagen en el servidor."
        ]);
        exit;
    }
}

try {
    $sql = "INSERT INTO products (name, category, price, stock, description, image)
            VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$name, $category, $price, $stock, $desc, $imagePath]);

    echo json_encode([
        "status" => "success",
        "message" => "Producto guardado correctamente."
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Ocurrió un error al guardar en la BD: " . $e->getMessage()
    ]);
}
?>
