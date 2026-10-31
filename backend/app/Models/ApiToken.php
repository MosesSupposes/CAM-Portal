<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApiToken extends Model
{
    protected $table = 'api_tokens';

    protected $fillable = ['member_id', 'token_hash', 'expires_at'];

    protected $hidden = ['token_hash'];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}
