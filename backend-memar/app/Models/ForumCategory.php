<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ForumCategory extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'order'];

    public function topics(): HasMany
    {
        return $this->hasMany(ForumTopic::class, 'category_id');
    }
}
