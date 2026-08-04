<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuthService;
use App\Services\FileStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class AuthController extends ApiController
{
    public function __construct(private readonly AuthService $auth) {}

    /** تسجيل الدخول — يُرجع التوكن وبيانات المستخدم. */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->auth->login(
            $request->string('email')->toString(),
            $request->string('password')->toString(),
        );

        return $this->ok([
            'token' => $result['token'],
            'user' => new UserResource($result['user']),
        ], 'تم تسجيل الدخول بنجاح');
    }

    /** تسجيل عميل جديد ذاتيًا — يُنشئ الحساب ويربطه بالـCRM ويدخله فورًا. */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->auth->register($request->validated());

        return $this->created([
            'token' => $result['token'],
            'user' => new UserResource($result['user']),
        ], 'تم إنشاء حسابك بنجاح — أهلًا بك في معمار');
    }

    /** طلب رابط استعادة كلمة المرور — رسالة عامة لا تكشف إن كان البريد مسجّلًا. */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $this->auth->sendResetLink($request->string('email')->toString());

        return $this->ok(null, 'إن كان البريد مسجّلًا، أرسلنا إليه رابط استعادة كلمة المرور.');
    }

    /** إعادة تعيين كلمة المرور برمز صالح. */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = $this->auth->resetPassword($request->validated());

        if ($status !== Password::PASSWORD_RESET) {
            return $this->fail('الرابط غير صالح أو منتهي الصلاحية — اطلب رابطًا جديدًا.', 422);
        }

        return $this->ok(null, 'تم تحديث كلمة المرور — يمكنك تسجيل الدخول الآن.');
    }

    /** بيانات المستخدم الحالي. */
    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return $this->ok(new UserResource($user));
    }

    /** رفع/تغيير الصورة الشخصية للموظف (بالنقر على دائرة كارت السايدبار). */
    public function uploadAvatar(Request $request, FileStorageService $files): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $request->validate(['file' => ['required', 'file', 'image', 'max:3072']]); // 3MB
        $ext = strtolower($request->file('file')->getClientOriginalExtension());
        abort_unless(in_array($ext, ['jpg', 'jpeg', 'png', 'webp'], true), 422, 'الصيغ المدعومة: JPG, PNG, WEBP.');

        $old = $user->avatarFile; // نحذفها بعد نجاح الحفظ
        $stored = $files->store($request->file('file'), ['folder' => 'صور الموظفين'], $user->id);
        $user->avatar_file_id = $stored->id;
        $user->save();

        if ($old) {
            $files->delete($old);
        }

        return $this->ok(new UserResource($user->refresh()), 'تم تحديث صورتك الشخصية.');
    }

    /** حذف الصورة الشخصية للموظف. */
    public function deleteAvatar(Request $request, FileStorageService $files): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $avatar = $user->avatarFile;
        if ($avatar) {
            $user->avatar_file_id = null;
            $user->save();
            $files->delete($avatar);
        }

        return $this->ok(new UserResource($user->refresh()), 'تم حذف صورتك الشخصية.');
    }

    /** تسجيل الخروج — إلغاء التوكن الحالي. */
    public function logout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->auth->logout($user);

        return $this->ok(null, 'تم تسجيل الخروج');
    }

    /**
     * حفظ تفضيلات القائمة الجانبية للمستخدم (المخفي/المطوي) في قاعدة البيانات
     * لتبقى ثابتة عبر الأجهزة وتحديثات السيرفر (بدل التخزين المحلي فقط).
     */
    public function updateUiPrefs(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'nav_hidden' => ['sometimes', 'array'],
            'nav_hidden.*' => ['boolean'],
            'nav_collapsed' => ['sometimes', 'array'],
            'nav_collapsed.*' => ['boolean'],
        ]);

        // دمج جزئي: لا يمسح المفتاح الآخر إن أُرسل أحدهما فقط.
        $user->ui_prefs = array_merge($user->ui_prefs ?? [], $data);
        $user->save();

        return $this->ok($user->ui_prefs, 'تم حفظ تفضيلات القائمة');
    }
}
