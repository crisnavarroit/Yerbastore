<?php
session_start();
require_once 'config.php';

if (isset($_SESSION['admin_logged']) && $_SESSION['admin_logged'] === true) {
    header('Location: admin.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    $adminUser = ADMIN_USER;
    $adminPass = ADMIN_PASS;

    if ($username === $adminUser && $password === $adminPass) {
        $_SESSION['admin_logged'] = true;
        $_SESSION['admin_user'] = $username;

        header('Location: admin.php');
        exit;
    } else {
        $error = 'Usuario o contraseña incorrectos.';
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Admin | Yerba Store</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <style>
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #faf9f6; /* Soft beige background */
            font-family: 'Inter', sans-serif;
        }

        .login-card {
            width: 100%;
            max-width: 420px;
            background: white;
            border-radius: 18px;
            padding: 2.5rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.06);
            border: 1px solid rgba(0,0,0,0.04);
        }

        .login-card h1 {
            margin-top: 0;
            margin-bottom: 0.5rem;
            color: #d84315; /* Match yerba orange */
            font-family: 'Outfit', sans-serif;
            font-size: 2rem;
            font-weight: 700;
        }

        .login-card p {
            color: #666666;
            margin-bottom: 2rem;
            font-size: 0.95rem;
            line-height: 1.5;
        }

        .form-group {
            margin-bottom: 1.25rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #333333;
            font-size: 0.95rem;
        }

        .form-group input {
            width: 100%;
            padding: 0.9rem 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            box-sizing: border-box;
            font-size: 1rem;
            color: #1a1a1a;
            transition: border-color 0.2s;
            font-family: 'Inter', sans-serif;
        }

        .form-group input:focus {
            outline: none;
            border-color: #d84315;
        }

        .error-box {
            background: #fee2e2;
            color: #dc2626;
            padding: 0.8rem 1rem;
            border-radius: 10px;
            margin-bottom: 1.5rem;
            font-size: 0.95rem;
            font-weight: 500;
            border: 1px solid #fca5a5;
        }

        .btn-primary {
            background: #d84315;
            color: white;
            border: none;
            padding: 1rem;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;
            font-family: 'Outfit', sans-serif;
        }
        
        .btn-primary:hover {
            background: #bf360c;
        }

        .btn-primary:active {
            transform: scale(0.98);
        }

        .back-link {
            display: inline-block;
            margin-top: 1.5rem;
            color: #d84315;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
            font-size: 0.95rem;
        }

        .back-link:hover {
            color: #bf360c;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="login-card">
        <h1>Panel Yerba Store</h1>
        <p>Iniciá sesión para gestionar el inventario y los pedidos de la tienda matera.</p>

        <?php if ($error !== ''): ?>
            <div class="error-box"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <form method="POST" action="">
            <div class="form-group">
                <label for="username">Usuario</label>
                <input type="text" id="username" name="username" placeholder="admin" required>
            </div>

            <div class="form-group">
                <label for="password">Contraseña</label>
                <input type="password" id="password" name="password" placeholder="••••••••" required>
            </div>

            <button type="submit" class="btn-primary" style="width:100%;">Ingresar</button>
        </form>

        <a href="index.html" class="back-link">← Volver a la web</a>
    </div>
</body>
</html>
