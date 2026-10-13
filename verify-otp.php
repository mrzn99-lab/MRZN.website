<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed.']);
  exit;
}

function jsonError($message, $status = 400) {
  http_response_code($status);
  echo json_encode(['error' => $message]);
  exit;
}

function supabaseRequest($method, $path, $query = [], $body = null) {
  $url = getenv('SUPABASE_URL') ?: $_ENV['SUPABASE_URL'] ?? null;
  $key = getenv('SUPABASE_SERVICE_ROLE_KEY') ?: $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? null;

  if (!$url || !$key) {
    return ['ok' => false, 'message' => 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured.'];
  }

  $fullUrl = rtrim($url, '/') . '/rest/v1' . $path;
  if (!empty($query)) {
    $fullUrl .= '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986);
  }

  $ch = curl_init($fullUrl);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => [
      'apikey: ' . $key,
      'Authorization: Bearer ' . $key,
      'Content-Type: application/json',
      'Accept: application/json'
    ],
    CURLOPT_SSL_VERIFYPEER => true
  ]);

  if ($body !== null) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
  }

  $response = curl_exec($ch);
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $error = curl_error($ch);
  curl_close($ch);

  if ($error) {
    return ['ok' => false, 'message' => $error, 'status' => $status];
  }

  return [
    'ok' => $status >= 200 && $status < 300,
    'status' => $status,
    'data' => json_decode($response, true),
    'raw' => $response
  ];
}

try {
  $input = file_get_contents('php://input');
  $data = json_decode($input, true) ?: [];
  $email = strtolower(trim((string) ($data['email'] ?? '')));
  $code = trim((string) ($data['code'] ?? ''));

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('A valid email address is required.');
  }

  if (!preg_match('/^\d{8}$/', $code)) {
    jsonError('OTP must be exactly 8 digits.');
  }

  $lookup = supabaseRequest('GET', '/otp_codes', [
    'email' => 'eq.' . rawurlencode($email),
    'used' => 'eq.false',
    'expires_at' => 'gt.' . rawurlencode(date('c')),
    'order' => 'created_at.desc',
    'limit' => '20'
  ]);

  if (!$lookup['ok']) {
    jsonError($lookup['message'] ?: 'Unable to verify OTP.', 500);
  }

  $rows = is_array($lookup['data']) ? $lookup['data'] : [];
  $match = null;

  foreach ($rows as $row) {
    if (isset($row['code']) && (string) $row['code'] === $code) {
      $match = $row;
      break;
    }
  }

  if (!$match) {
    jsonError('Invalid or expired OTP code.', 401);
  }

  $update = supabaseRequest('PATCH', '/otp_codes?id=eq.' . rawurlencode((string) $match['id']), [], [
    'used' => true
  ]);

  if (!$update['ok']) {
    jsonError($update['message'] ?: 'Failed to mark the OTP as used.', 500);
  }

  echo json_encode([
    'success' => true,
    'message' => 'OTP verified successfully.',
    'email' => $email
  ]);
} catch (Throwable $e) {
  jsonError('Unable to verify OTP: ' . $e->getMessage(), 500);
}
