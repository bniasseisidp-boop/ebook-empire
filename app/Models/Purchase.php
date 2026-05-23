<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    protected $fillable = [
        'book_id', 'email', 'stripe_payment_id', 'license_key',
        'amount', 'status', 'ip_address',
    ];

    public function book()
    {
        return $this->belongsTo(Book::class);
    }
}
