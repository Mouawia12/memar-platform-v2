<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * بحث عربي يتسامح مع اختلاف الكتابة: «احمد» تجد «أحمد»، و«امنة» تجد «آمنة»،
 * و«فاطمه» تجد «فاطمة». يُطبَّع النص المبحوث عنه في PHP والعمود في SQL
 * (REPLACE يعمل على MySQL وSQLite معًا).
 */
final class ArabicSearch
{
    /** @var array<string, string> */
    private const MAP = ['أ' => 'ا', 'إ' => 'ا', 'آ' => 'ا', 'ٱ' => 'ا', 'ة' => 'ه', 'ى' => 'ي', 'ؤ' => 'و', 'ئ' => 'ي'];

    public static function normalize(string $text): string
    {
        // التشكيل والتطويل لا يغيّران المعنى في البحث.
        $text = (string) preg_replace('/[\x{064B}-\x{065F}\x{0670}\x{0640}]/u', '', $text);

        return strtr(trim($text), self::MAP);
    }

    /**
     * يضيف شرط «أو» لكل عمود داخل مجموعة where واحدة.
     *
     * @param  Builder<Model>  $query
     * @param  list<string>  $columns  أعمدة نصية عربية تُطبَّع
     * @param  list<string>  $plainColumns  أعمدة تُبحث كما هي (هاتف، بريد)
     */
    public static function where(Builder $query, string $term, array $columns, array $plainColumns = []): void
    {
        $normalized = self::normalize($term);
        $raw = trim($term);

        $query->where(function (Builder $q) use ($columns, $plainColumns, $normalized, $raw): void {
            foreach ($columns as $column) {
                $wrapped = $q->getQuery()->getGrammar()->wrap($q->qualifyColumn($column));
                $q->orWhereRaw(self::normalizedColumn($wrapped).' like ?', ["%{$normalized}%"]);
            }
            foreach ($plainColumns as $column) {
                $q->orWhere($column, 'like', "%{$raw}%");
            }
        });
    }

    private static function normalizedColumn(string $wrappedColumn): string
    {
        $sql = "coalesce({$wrappedColumn}, '')";
        foreach (self::MAP as $from => $to) {
            $sql = "replace({$sql}, '{$from}', '{$to}')";
        }

        return $sql;
    }
}
