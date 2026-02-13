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
        'subtotal',
        'delivery_fee',
        'total',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $lastOrder = static::orderBy('created_at', 'desc')->first();
            $nextNumber = $lastOrder ? (int) str_replace('#PED-', '', $lastOrder->readable_id) + 1 : 1001;
            $model->readable_id = '#PED-' . $nextNumber;
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
