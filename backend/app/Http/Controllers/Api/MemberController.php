<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\ZodiacSign;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class MemberController extends Controller
{
    /**
     * Display a listing of club members with optional element / search filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Member::with('zodiacSign');

        if ($request->filled('element')) {
            $element = $request->input('element');
            $query->whereHas('zodiacSign', function ($q) use ($element) {
                $q->where('element', $element);
            });
        }

        if ($request->filled('sign')) {
            $query->where('zodiac_sign_name', $request->input('sign'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', $search)
                  ->orWhere('email', 'like', $search)
                  ->orWhere('zodiac_sign_name', 'like', $search);
            });
        }

        $members = $query->orderBy('full_name')->get();

        return response()->json([
            'status' => 'success',
            'count' => $members->count(),
            'data' => $members,
        ]);
    }

    /**
     * Store a newly created member.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'gender_identity' => 'nullable|string|max:50',
            'zodiac_sign_name' => 'required|string',
            'club_status' => 'nullable|in:active,officer,pending,alumni',
            'bio' => 'nullable|string',
        ]);

        $zodiac = ZodiacSign::where('name', $validated['zodiac_sign_name'])->first();
        if ($zodiac) {
            $validated['zodiac_sign_id'] = $zodiac->id;
        }

        $member = Member::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Member registered successfully in C.A.M.',
            'data' => $member,
        ], 201);
    }

    /**
     * Aggregated Elemental breakdown for C.A.M. dashboard.
     */
    public function analytics(): JsonResponse
    {
        $elementStats = DB::table('members')
            ->leftJoin('zodiac_signs', 'members.zodiac_sign_id', '=', 'zodiac_signs.id')
            ->select('zodiac_signs.element', DB::raw('count(members.id) as total'))
            ->groupBy('zodiac_signs.element')
            ->get();

        $totalMembers = Member::count();
        $officersCount = Member::where('club_status', 'officer')->count();

        return response()->json([
            'status' => 'success',
            'metrics' => [
                'total_members' => $totalMembers,
                'officers_count' => $officersCount,
                'elements' => $elementStats,
            ],
        ]);
    }
}
