<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Models\ActivityRead;
use App\Models\Comment;
use App\Models\Directive;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

/**
 * نشاط البطاقة المشترك بين المهام والمتابعات (طلب أيمن 2026-08-29): توجيهات
 * الإدارة وردودها، التعليقات، وقراءة كل مستخدم. المستعمِل يُعرّف صاحب البطاقة
 * عبر activityOwnerId() — هو مَن يُنتظر ردّه ومَن تُميَّز بطاقته بـ«لي».
 */
trait HasCardActivity
{
    /** معرّف صاحب البطاقة (المكلَّف بالمهمة / منشئ المتابعة). */
    abstract public function activityOwnerId(): ?int;

    /** توجيهات الإدارة — الأحدث أولًا. */
    public function directives(): MorphMany
    {
        return $this->morphMany(Directive::class, 'subject')->latest('id');
    }

    /** آخر توجيه — هو وحده ما تعرضه البطاقة (الباقي تاريخ داخل النافذة). */
    public function latestDirective(): MorphOne
    {
        return $this->morphOne(Directive::class, 'subject')->latestOfMany();
    }

    /** التعليقات بترتيب المحادثة (الأقدم أولًا). */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'subject')->oldest();
    }

    /** آخر تعليق — يظهر بنصّه وصاحبه وتاريخه على البطاقة. */
    public function latestComment(): MorphOne
    {
        return $this->morphOne(Comment::class, 'subject')->latestOfMany();
    }

    /** قراءات المستخدمين لنشاط هذه البطاقة. */
    public function reads(): MorphMany
    {
        return $this->morphMany(ActivityRead::class, 'subject');
    }
}
