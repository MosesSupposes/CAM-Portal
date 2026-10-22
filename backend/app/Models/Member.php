<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    use HasFactory;

    protected $table = 'members';

    protected $fillable = [
        'user_id',
        'full_name',
        'email',
        'phone',
        'gender_identity',
        'zodiac_sign_id',
        'zodiac_sign_name',
        'club_status',
        'bio',
    ];

    public function zodiacSign()
    {
        return $this->belongsTo(ZodiacSign::class, 'zodiac_sign_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function rsvps()
    {
        return $this->hasMany(EventRsvp::class);
    }

    public function scopeActive($query)
    {
        return $query->where('club_status', 'active');
    }

    public function scopeOfficers($query)
    {
        return $query->where('club_status', 'officer');
    }
}
