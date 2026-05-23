<?php

use App\Http\Controllers\BookController;
use App\Http\Controllers\AdminController;
use App\Http\Middleware\AdminAuth;
use Illuminate\Support\Facades\Route;

// ══════════════════════════════════════════════
//  PUBLIC ROUTES
// ══════════════════════════════════════════════
Route::prefix('books')->group(function () {
    Route::get('/',                       [BookController::class, 'index']);
    Route::get('/{book}',                 [BookController::class, 'show']);
    Route::get('/{book}/preview',         [BookController::class, 'preview']);
    Route::get('/{book}/get-file',        [BookController::class, 'getFile']);
    Route::post('/{book}/download',       [BookController::class, 'requestDownload']);
    Route::post('/{book}/purchase',       [BookController::class, 'createPaymentIntent']);
    Route::post('/{book}/confirm-purchase', [BookController::class, 'confirmPurchase']);
});

// Stripe webhook (raw body)
Route::post('/webhook/stripe', [BookController::class, 'stripeWebhook'])
    ->withoutMiddleware(['api']);

// ══════════════════════════════════════════════
//  ADMIN ROUTES (protected)
// ══════════════════════════════════════════════
Route::post('/admin/login', [AdminController::class, 'login']);

Route::middleware(AdminAuth::class)->prefix('admin')->group(function () {
    Route::get('/books',            [AdminController::class, 'books']);
    Route::post('/books',           [AdminController::class, 'uploadBook']);
    Route::put('/books/{book}',     [AdminController::class, 'updateBook']);
    Route::delete('/books/{book}',  [AdminController::class, 'deleteBook']);
    Route::get('/downloads',        [AdminController::class, 'downloads']);
    Route::get('/purchases',        [AdminController::class, 'purchases']);
    Route::get('/stats',            [AdminController::class, 'stats']);
    Route::get('/chart-data',       [AdminController::class, 'chartData']);
});
