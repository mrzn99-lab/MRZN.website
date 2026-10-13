<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';
$code = $data['code'] ?? '';

if (!$email || !$code) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing email or code']);
  exit;
}

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid email']);
  exit;
}

// Email content
$subject = "MRZN Apps & Games - Your OTP Code";

$htmlBody = "
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #0a0e27; }
    .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f1935 0%, #1a2847 100%); padding: 40px; border-radius: 16px; }
    .header { text-align: center; color: #00e5ff; margin-bottom: 30px; }
    .otp-box { background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.2); padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
    .otp-code { font-size: 36px; font-weight: 800; color: #00e5ff; letter-spacing: 8px; font-family: monospace; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1>🔐 Your OTP Code</h1>
      <p>MRZN Apps & Games</p>
    </div>

    <p style='color: #e0e0e0;'>Enter this code to verify your identity:</p>

    <div class='otp-box'>
      <div class='otp-code'>$code</div>
    </div>

    <p style='color: #a0a0a0; font-size: 13px;'>This code expires in 10 minutes</p>

    <div class='footer'>
      <p>© 2026 MRZN Apps & Games</p>
      <p>Never share this code with anyone</p>
    </div>
  </div>
</body>
</html>
";

// Send email
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/html; charset=UTF-8\r\n";
$headers .= "From: noreply@mrznappsames.com\r\n";

if (mail($email, $subject, $htmlBody, $headers)) {
  echo json_encode(['success' => true]);
} else {
  http_response_code(500);
  echo json_encode(['error' => 'Failed to send email']);
}
?>
