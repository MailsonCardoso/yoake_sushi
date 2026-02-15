<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CashRegister extends Model
{
    use HasUuids;

    protected $fillable = [
        'opening_balance',
        'closing_balance',
        'total_cash',
        'total_nubank',
        'total_picpay',
        'total_pix',
        'total_ifood',
        'opened_at',
        'closed_at',
        'status',
        'user_id'
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
