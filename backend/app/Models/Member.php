<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    use HasFactory;

    protected $table = 'members';

    protected $fillable = [
        'username',
        'student_id',
        'password_hash',
        'account_role',
        'import_source_key',
        'full_name',
        'email',
        'phone',
        'gender_identity',
        'zodiac_sign_id',
        'zodiac_sign_name',
        'club_status',
        'bio',
        'email_verified_at',
        'remember_token',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    public function zodiacSign()
    {
        return $this->belongsTo(ZodiacSign::class, 'zodiac_sign_id');
    }

    public function apiTokens()
    {
        return $this->hasMany(ApiToken::class);
    }

    public function savedEntries()
    {
        return $this->hasMany(MemberEntry::class);
    }

    public function createdEvents()
    {
        return $this->hasMany(Event::class, 'created_by_member_id');
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
