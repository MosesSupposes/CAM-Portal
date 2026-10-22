<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ZodiacSign;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AstroEngineController extends Controller
{
    /**
     * Return all 12 Zodiac signs with traits, elements, and symbols.
     */
    public function signs(): JsonResponse
    {
        $signs = ZodiacSign::orderBy('id')->get();
        return response()->json([
            'status' => 'success',
            'data' => $signs,
        ]);
    }

    /**
     * Compute Zodiac sign based on birth date.
     */
    public function computeSign(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => 'required|integer|between:1,12',
            'day' => 'required|integer|between:1,31',
        ]);

        $m = $validated['month'];
        $d = $validated['day'];

        $signName = match (true) {
            ($m == 3 && $d >= 21) || ($m == 4 && $d <= 19) => 'Aries',
            ($m == 4 && $d >= 20) || ($m == 5 && $d <= 20) => 'Taurus',
            ($m == 5 && $d >= 21) || ($m == 6 && $d <= 20) => 'Gemini',
            ($m == 6 && $d >= 21) || ($m == 7 && $d <= 22) => 'Cancer',
            ($m == 7 && $d >= 23) || ($m == 8 && $d <= 22) => 'Leo',
            ($m == 8 && $d >= 23) || ($m == 9 && $d <= 22) => 'Virgo',
            ($m == 9 && $d >= 23) || ($m == 10 && $d <= 22) => 'Libra',
            ($m == 10 && $d >= 23) || ($m == 11 && $d <= 21) => 'Scorpio',
            ($m == 11 && $d >= 22) || ($m == 12 && $d <= 21) => 'Sagittarius',
            ($m == 12 && $d >= 22) || ($m == 1 && $d <= 19) => 'Capricorn',
            ($m == 1 && $d >= 20) || ($m == 2 && $d <= 18) => 'Aquarius',
            default => 'Pisces',
        };

        $sign = ZodiacSign::where('name', $signName)->first();

        return response()->json([
            'status' => 'success',
            'calculated_sign' => $signName,
            'details' => $sign,
        ]);
    }

    /**
     * Return current celestial alignments & transits for the C.A.M. club.
     */
    public function transits(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'current_epoch' => now()->toIso8601String(),
            'lunar_phase' => 'Waxing Gibbous',
            'active_alignments' => [
                [
                    'aspect' => 'Sun in Scorpio',
                    'meaning' => 'Deep transformation, intuitive clarity, and collective focus.',
                    'element' => 'Water',
                ],
                [
                    'aspect' => 'Mercury in Sagittarius',
                    'meaning' => 'Big picture thinking, philosophical inquiry, academic expansion.',
                    'element' => 'Fire',
                ],
                [
                    'aspect' => 'Jupiter in Gemini',
                    'meaning' => 'Curiosity, multifaceted learning, club discourse.',
                    'element' => 'Air',
                ],
            ],
        ]);
    }
}
