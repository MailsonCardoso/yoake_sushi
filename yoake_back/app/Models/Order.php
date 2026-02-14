<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'readable_id',
        'customer_id',
        'table_id',
        'type',
        'channel',
        'status',
        'payment_method',
        'delivery_address',
        'delivery_location_link',
        'subtotal',
        'delivery_fee',
        'distance_km',
        'total',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $lastOrder = static::orderBy('created_at', 'desc')->first();

            // Extração de número robusta (pega qualquer coisa após o primeiro hífen -)
            $lastNumber = 1000;
            if ($lastOrder && preg_match('/-(\d+)$/', $lastOrder->readable_id, $matches)) {
                $lastNumber = (int) $matches[1];
            }
            $nextNumber = $lastNumber + 1;

            // Lógica de Prefixos sugerida pelo usuário
            $prefix = '#PED'; // Padrão Balcão

            if ($model->channel === 'iFood') {
                $prefix = '#IF';
            } elseif ($model->type === 'mesa') {
                $prefix = '#MES';
            } elseif ($model->type === 'delivery') {
                $prefix = '#WPP';
                // Se for delivery mas o canal for iFood, o IF ganha a prioridade acima
            }

            $model->readable_id = $prefix . '-' . $nextNumber;
        });
    }

    protected $casts = [
        'subtotal' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function table()
    {
        return $this->belongsTo(RestaurantTable::class, 'table_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
