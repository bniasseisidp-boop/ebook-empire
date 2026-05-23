<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Download extends Model
{
    protected $fillable = [
        'book_id', 'email', 'ip_address', 'download_token',
    ];

    public function book()
    {
        return $this->belongsTo(Book::class);
    }
}
