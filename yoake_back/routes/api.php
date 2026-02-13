<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\RestaurantTableController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Auth
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Produtos
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);

    // Clientes
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);

    // Mesas
    Route::get('/tables', [RestaurantTableController::class, 'index']);
    Route::post('/tables', [RestaurantTableController::class, 'store']);
    Route::patch('/tables/{id}/open', [RestaurantTableController::class, 'open']);
    Route::patch('/tables/{id}/close', [RestaurantTableController::class, 'close']);

    // Pedidos (POS & KDS)
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/kds', [OrderController::class, 'kds']);
    Route::get('/orders/ready', [OrderController::class, 'ready']);
    Route::get('/orders/active-delivery', [OrderController::class, 'activeDelivery']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
});
