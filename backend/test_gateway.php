<?php

// Simple test without Laravel dependencies
$classFile = __DIR__ . '/app/Services/Payment/MayaPaymentGateway.php';
$interfaceFile = __DIR__ . '/app/Contracts/PaymentGatewayInterface.php';

if (!file_exists($classFile)) {
    echo "MayaPaymentGateway.php not found\n";
    exit(1);
}

if (!file_exists($interfaceFile)) {
    echo "PaymentGatewayInterface.php not found\n";
    exit(1);
}

// Include the files
require_once $interfaceFile;

// Check class syntax by parsing the file
$classContent = file_get_contents($classFile);
if (strpos($classContent, 'implements PaymentGatewayInterface') === false) {
    echo "✗ MayaPaymentGateway does not implement PaymentGatewayInterface\n";
    exit(1);
}

echo "✓ MayaPaymentGateway declares implementation of PaymentGatewayInterface\n";

// Extract method signatures from the class
preg_match_all('/public function (\w+)\([^)]*\)/', $classContent, $matches);
$implementedMethods = $matches[1] ?? [];

echo "Implemented methods found: " . count($implementedMethods) . "\n";

// Required methods from interface
$requiredMethods = [
    'createPayment',
    'verifyPayment',
    'refundPayment',
    'cancelPayment',
    'verifyWebhookSignature',
    'parseWebhook',
    'getGatewayName',
    'getSupportedCurrencies',
    'supportsCurrency',
    'getMinimumAmount'
];

$missingMethods = [];
foreach ($requiredMethods as $method) {
    if (in_array($method, $implementedMethods)) {
        echo "✓ Method {$method} implemented\n";
    } else {
        echo "✗ Method {$method} missing\n";
        $missingMethods[] = $method;
    }
}

if (empty($missingMethods)) {
    echo "\n🎉 All required methods implemented!\n";
} else {
    echo "\n❌ Missing methods: " . implode(', ', $missingMethods) . "\n";
}

// Check refundPayment signature
if (preg_match('/public function refundPayment\([^)]*\)/', $classContent, $match)) {
    $signature = $match[0];
    if (strpos($signature, '?string $reason = null') !== false) {
        echo "✓ refundPayment signature includes reason parameter\n";
    } else {
        echo "✗ refundPayment signature missing reason parameter\n";
        echo "  Found: {$signature}\n";
        echo "  Expected: public function refundPayment(string \$transactionId, ?float \$amount = null, ?string \$reason = null)\n";
    }
} else {
    echo "✗ refundPayment method not found\n";
}

echo "\nSyntax check completed!\n";