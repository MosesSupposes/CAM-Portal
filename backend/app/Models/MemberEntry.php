<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MemberEntry extends Model
{
    protected $table = 'member_entries';

    protected $fillable = ['member_id', 'entry_key', 'entry_value'];

    protected $casts = ['entry_value' => 'array'];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}
