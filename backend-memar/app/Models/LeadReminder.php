<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasCardActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * تذكير متابعة على فرصة/عميل. due = حان وقته ولم يُنجَز بعد.
 */
class LeadReminder extends Model
{
    use HasCardActivity; // نفس نشاط بطاقة المهمة: توجيهات وتعليقات وقراءات

    protected $fillable = ['contact_id', 'remind_at', 'repeat_every', 'note', 'done', 'created_by'];

    /** دوريات التكرار المسموحة ومقدار كل واحدة بالأيام. */
    public const REPEATS = ['3d' => 3, 'week' => 7, 'month' => 30];

    protected function casts(): array
    {
        return [
            'remind_at' => 'datetime',
            'done' => 'boolean',
        ];
    }

    /** @return BelongsTo<Contact, $this> */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * صاحب بطاقة المتابعة هو مَن أنشأها — وهو نفسه معيار «متابعاتي فقط» في
     * اللوحة، فلا يختلف معنى «لي» بين الفلتر والتمييز.
     */
    public function activityOwnerId(): ?int
    {
        return $this->created_by;
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
