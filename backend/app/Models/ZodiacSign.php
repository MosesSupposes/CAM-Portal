<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ZodiacSign extends Model
{
    use HasFactory;

    protected $table = 'zodiac_signs';
    public $timestamps = false;

    protected $fillable = [
        'name',
        'symbol',
        'element',
        'modality',
        'ruling_planet',
        'date_range',
        'traits',
    ];

    public function members()
    {
        return $this->hasMany(Member::class, 'zodiac_sign_id');
    }
}
