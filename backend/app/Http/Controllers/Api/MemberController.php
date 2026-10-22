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
     * Import members from CSV (supporting members.csv format).
     */
    public function importCSV(Request $request): JsonResponse
    {
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $file = $request->file('csv_file');
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);

        $imported = 0;
        DB::beginTransaction();
        try {
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) < 5) continue;
                // Format: Name, Email, Number, Gender, Sign
                $name = trim($row[0]);
                $email = trim($row[1]) ?: null;
                $phone = trim($row[2]) ?: null;
                $gender = trim($row[3]) ?: null;
                $signName = trim($row[4]);

                $sign = ZodiacSign::where('name', $signName)->first();

                Member::updateOrCreate(
                    ['full_name' => $name],
                    [
                        'email' => $email,
                        'phone' => $phone,
                        'gender_identity' => $gender,
                        'zodiac_sign_name' => $signName,
                        'zodiac_sign_id' => $sign ? $sign->id : null,
                        'club_status' => 'active',
                    ]
                );
                $imported++;
            }
            DB::commit();
            fclose($handle);

            return response()->json([
                'status' => 'success',
                'message' => "Successfully imported {$imported} members.",
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            fclose($handle);
            return response()->json([
                'status' => 'error',
                'message' => 'CSV Import failed: ' . $e->getMessage(),
            ], 422);
        }
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
