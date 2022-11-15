<?php

if (!empty($argv[1])) {
    parse_str($argv[1], $_GET);
} else {
    echo 'error';
    return;
}
$url = '';
$payload = '';
if ($_GET['type'] === "order/order_detail" && !empty($_GET['order_id'])) {
    $url = 'https://moogold.com/wp-json/v1/api/order/order_detail';
    $payload = '{ 
"path": "' . $_GET['type'] . '",
"order_id": "' . $_GET['order_id'] . '"
}';
} elseif ($_GET['type'] === "order/create_order" && !empty($_GET['user_id']) && !empty($_GET['product_id']) && !empty($_GET['server_id'])) {
    $url = 'https://moogold.com/wp-json/v1/api/order/create_order';
    $payload = '{ 
"path": "' . $_GET['type'] . '",
"data": { 
"category": "1", 
"product-id": "' . $_GET['product_id'] . '", 
"quantity": "1", 
"User ID": "' . $_GET['user_id'] . '", 
"Server": "' . $_GET['server_id'] . '" 
} 
}';
} else {
    echo 'error';
    return;
}

$timestamp = time();
$path = $_GET['type'];
$STRING_TO_SIGN =  $payload . $timestamp . $path;
$auth = hash_hmac('SHA256', $STRING_TO_SIGN, 'o23NDABxV0');
$curl = curl_init();
$curl_opts = array(
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 0,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => array(
        'timestamp: ' . $timestamp,
        'auth: ' . $auth,
        'Authorization: Basic ' . base64_encode('8637179bfdc03fef67cc5f83ceeecb03:o23NDABxV0'),
        'Content-Type: application/json'
    ),
);
curl_setopt_array($curl, $curl_opts);
$response = curl_exec($curl);

curl_close($curl);
echo $response;