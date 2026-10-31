<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $table = 'events';

    protected $fillable = [
        'title',
        'slug',
        'description',
        'event_type',
        'location',
        'event_date',
        'celestial_alignment',
        'max_attendees',
        'created_by_member_id',
    ];

    protected $casts = [
        'event_date' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(Member::class, 'created_by_member_id');
    }

    public function rsvps()
    {
        return $this->hasMany(EventRsvp::class);
    }
}
