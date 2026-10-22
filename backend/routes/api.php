<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\AstroEngineController;

/*
|--------------------------------------------------------------------------
| C.A.M. API Routes (Cosmic Astrological Minds)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Health & System Status
    Route::get('/health', function () {
        return response()->json([
            'status' => 'healthy',
            'system' => 'Cosmic Astrological Minds (C.A.M.) API',
            'time' => now()->toIso8601String(),
        ]);
    });

    // Astrological Ephemeris & Signs
    Route::get('/zodiac/signs', [AstroEngineController::class, 'signs']);
    Route::post('/zodiac/compute', [AstroEngineController::class, 'computeSign']);
    Route::get('/zodiac/transits', [AstroEngineController::class, 'transits']);

    // Members & Roster API (incorporating members.csv)
    Route::get('/members', [MemberController::class, 'index']);
    Route::post('/members', [MemberController::class, 'store']);
    Route::post('/members/import-csv', [MemberController::class, 'importCSV']);
    Route::get('/members/analytics', [MemberController::class, 'analytics']);

    // Events & Gatherings
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store']);
});
