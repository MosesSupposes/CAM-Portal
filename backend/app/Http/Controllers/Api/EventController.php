<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class EventController extends Controller
{
    public function index(): JsonResponse
    {
        $events = Event::orderBy('event_date', 'asc')->get();
        return response()->json([
            'status' => 'success',
            'data' => $events,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'event_type' => 'required|in:meeting,stargazing,workshop,social,transits',
            'location' => 'required|string|max:255',
            'event_date' => 'required|date',
            'celestial_alignment' => 'nullable|string|max:255',
        ]);

        $validated['slug'] = Str::slug($validated['title']) . '-' . time();
        $validated['description'] = $validated['description'] ?? 'C.A.M. Gathering';

        $event = Event::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Celestial event scheduled successfully.',
            'data' => $event,
        ], 201);
    }
}
