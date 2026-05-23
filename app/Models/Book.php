<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    protected $fillable = [
        'title', 'description', 'price', 'is_free',
        'filename', 'cover_image', 'category',
        'download_count', 'purchase_count',
    ];

    protected $casts = [
        'is_free' => 'boolean',
        'price'   => 'float',
    ];

    public function downloads()
    {
        return $this->hasMany(Download::class);
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }
}
