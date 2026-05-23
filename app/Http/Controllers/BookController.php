<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Download;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Stripe\Stripe;
use Stripe\PaymentIntent;

class BookController extends Controller
{
    /* ── GET /api/books ──────────────────────── */
    public function index(Request $request)
    {
        $q = Book::query()
            ->select('id','title','description','price','is_free','cover_image','category','download_count','purchase_count');

        if ($s = $request->search) {
            $q->where(fn($w) => $w->where('title','like',"%$s%")->orWhere('description','like',"%$s%"));
        }
        if ($c = $request->category) $q->where('category', $c);
        if ($request->free === 'true') $q->where('is_free', true);

        return response()->json($q->orderByDesc('purchase_count')->get());
    }

    /* ── GET /api/books/{id} ─────────────────── */
    public function show(Book $book)
    {
        return response()->json($book->only('id','title','description','price','is_free','cover_image','category','download_count','purchase_count'));
    }

    /* ── GET /api/books/{id}/preview ─────────── */
    public function preview(Book $book, Request $request)
    {
        $path = storage_path("app/books/{$book->filename}");

        if (!file_exists($path)) {
            return response()->json(['message' => 'Fichier introuvable'], 404);
        }

        return response()->file($path, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline',
            'X-Preview-Only'      => 'true',
            'Cache-Control'       => 'no-store',
        ]);
    }

    /* ── POST /api/books/{id}/download ──────── */
    public function requestDownload(Request $request, Book $book)
    {
        $request->validate(['email' => 'required|email']);

        if (!$book->is_free) {
            return response()->json(['message' => 'Ce livre est payant'], 403);
        }

        $token = (string) Str::uuid();

        $dl = Download::create([
            'book_id'        => $book->id,
            'email'          => $request->email,
            'ip_address'     => $request->ip(),
            'download_token' => $token,
        ]);

        $book->increment('download_count');

        // Send email
        $downloadUrl = config('app.url') . "/api/books/{$book->id}/get-file?token={$token}";
        \Mail::raw(
            "Bonjour,\n\nVoici votre lien de téléchargement pour **{$book->title}** :\n\n{$downloadUrl}\n\nCe lien est personnel et non transférable.\n\nEmpire Ebook",
            function ($m) use ($request, $book, $downloadUrl) {
                $m->to($request->email)
                  ->subject("📚 Votre ebook gratuit : {$book->title}")
                  ->html($this->buildDownloadEmail($book->title, $downloadUrl, $request->email));
            }
        );

        return response()->json(['success' => true, 'message' => 'Lien envoyé par email !']);
    }

    /* ── GET /api/books/{id}/get-file ────────── */
    public function getFile(Request $request, Book $book)
    {
        $token = $request->query('token');
        if (!$token) return response()->json(['message' => 'Token requis'], 401);

        // Check purchase or download token
        $valid = Purchase::where('license_key', $token)->where('book_id', $book->id)->where('status','completed')->exists()
            || Download::where('download_token', $token)->where('book_id', $book->id)->exists();

        if (!$valid) {
            return response()->json(['message' => 'Token invalide ou expiré'], 403);
        }

        $path = storage_path("app/books/{$book->filename}");
        if (!file_exists($path)) return response()->json(['message' => 'Fichier introuvable'], 404);

        return response()->download($path, "{$book->title}.pdf", ['Content-Type' => 'application/pdf']);
    }

    /* ── POST /api/books/{id}/purchase ────────── */
    public function createPaymentIntent(Request $request, Book $book)
    {
        $request->validate(['email' => 'required|email']);

        if ($book->is_free) {
            return response()->json(['message' => 'Ce livre est gratuit'], 422);
        }

        Stripe::setApiKey(config('services.stripe.secret'));

        $license = (string) Str::uuid();

        $intent = PaymentIntent::create([
            'amount'   => (int) round($book->price * 100),
            'currency' => 'eur',
            'metadata' => [
                'book_id'    => $book->id,
                'email'      => $request->email,
                'book_title' => $book->title,
                'license'    => $license,
            ],
        ]);

        Purchase::create([
            'book_id'           => $book->id,
            'email'             => $request->email,
            'stripe_payment_id' => $intent->id,
            'license_key'       => $license,
            'amount'            => $book->price,
            'status'            => 'pending',
            'ip_address'        => $request->ip(),
        ]);

        return response()->json([
            'client_secret' => $intent->client_secret,
            'license'       => $license,
            'book_title'    => $book->title,
        ]);
    }

    /* ── POST /api/books/{id}/confirm-purchase ── */
    public function confirmPurchase(Request $request, Book $book)
    {
        $request->validate(['payment_intent_id' => 'required|string']);

        Stripe::setApiKey(config('services.stripe.secret'));

        $intent = PaymentIntent::retrieve($request->payment_intent_id);

        if ($intent->status !== 'succeeded') {
            return response()->json(['message' => 'Paiement non confirmé'], 422);
        }

        $purchase = Purchase::where('stripe_payment_id', $intent->id)
            ->where('book_id', $book->id)
            ->first();

        if (!$purchase) {
            return response()->json(['message' => 'Transaction introuvable'], 404);
        }

        if ($purchase->status !== 'completed') {
            $purchase->update(['status' => 'completed']);
            $book->increment('purchase_count');

            $downloadUrl = config('app.url') . "/api/books/{$book->id}/get-file?token={$purchase->license_key}";

            // Send email with license
            \Mail::raw('', function ($m) use ($purchase, $book, $downloadUrl) {
                $m->to($purchase->email)
                  ->subject("🎉 Votre achat : {$book->title}")
                  ->html($this->buildPurchaseEmail($book->title, $purchase->license_key, $downloadUrl, $purchase->email));
            });
        }

        return response()->json(['success' => true]);
    }

    /* ── Stripe Webhook ───────────────────────── */
    public function stripeWebhook(Request $request)
    {
        $payload = $request->getContent();
        $sig     = $request->header('Stripe-Signature');

        try {
            Stripe::setApiKey(config('services.stripe.secret'));
            $event = \Stripe\Webhook::constructEvent($payload, $sig, config('services.stripe.webhook_secret'));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }

        if ($event->type === 'payment_intent.succeeded') {
            $pi       = $event->data->object;
            $purchase = Purchase::where('stripe_payment_id', $pi->id)->first();

            if ($purchase && $purchase->status !== 'completed') {
                $purchase->update(['status' => 'completed']);
                $purchase->book->increment('purchase_count');

                $downloadUrl = config('app.url') . "/api/books/{$purchase->book_id}/get-file?token={$purchase->license_key}";

                \Mail::raw('', function ($m) use ($purchase, $downloadUrl) {
                    $m->to($purchase->email)
                      ->subject("🎉 Votre achat : {$purchase->book->title}")
                      ->html($this->buildPurchaseEmail($purchase->book->title, $purchase->license_key, $downloadUrl, $purchase->email));
                });
            }
        }

        return response()->json(['received' => true]);
    }

    /* ── Email HTML templates ─────────────────── */
    private function buildDownloadEmail(string $title, string $url, string $email): string
    {
        return <<<HTML
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{margin:0;padding:0;background:#060a12;font-family:Inter,sans-serif;color:#f0f4ff}
.wrap{max-width:560px;margin:0 auto;padding:40px 20px}
.card{background:#0a0e1a;border:1px solid rgba(0,229,255,0.15);border-radius:20px;padding:40px;text-align:center}
.logo{font-size:48px;margin-bottom:8px}
h1{font-size:24px;font-weight:800;background:linear-gradient(135deg,#00e5ff,#7c4dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0 0 8px}
.sub{color:#6a7490;font-size:14px;margin-bottom:32px}
.title-box{background:rgba(0,229,255,0.08);border:1px solid rgba(0,229,255,0.2);border-radius:12px;padding:16px;margin-bottom:28px;font-weight:700;font-size:16px;color:#00e5ff}
.btn{display:inline-block;background:linear-gradient(135deg,#0044cc,#00e5ff);color:#fff;text-decoration:none;padding:16px 36px;border-radius:50px;font-weight:800;font-size:15px;margin-bottom:24px}
.note{font-size:12px;color:#6a7490;line-height:1.6}
.footer{margin-top:32px;font-size:11px;color:#6a7490}
</style></head><body>
<div class="wrap"><div class="card">
<div class="logo">📚</div>
<h1>EMPIRE EBOOK</h1>
<p class="sub">Votre livre gratuit est prêt !</p>
<div class="title-box">«&nbsp;$title&nbsp;»</div>
<a href="$url" class="btn">⬇️ Télécharger maintenant</a>
<p class="note">Ce lien est personnel. Il a été envoyé à <strong style="color:#00e5ff">$email</strong>.<br>Ne le partagez pas.</p>
</div><p class="footer" style="text-align:center">© 2025 Empire Ebook · Tous droits réservés</p></div>
</body></html>
HTML;
    }

    private function buildPurchaseEmail(string $title, string $license, string $url, string $email): string
    {
        return <<<HTML
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{margin:0;padding:0;background:#060a12;font-family:Inter,sans-serif;color:#f0f4ff}
.wrap{max-width:560px;margin:0 auto;padding:40px 20px}
.card{background:#0a0e1a;border:1px solid rgba(0,229,255,0.15);border-radius:20px;padding:40px;text-align:center}
.logo{font-size:48px;margin-bottom:8px}
h1{font-size:24px;font-weight:800;background:linear-gradient(135deg,#ffd700,#ff9500);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0 0 8px}
.sub{color:#6a7490;font-size:14px;margin-bottom:32px}
.title-box{background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.2);border-radius:12px;padding:16px;margin-bottom:20px;font-weight:700;font-size:16px;color:#ffd700}
.license{background:rgba(0,0,0,0.3);border:1px solid rgba(0,229,255,0.2);border-radius:10px;padding:14px;margin-bottom:24px;font-family:monospace;font-size:13px;color:#00e5ff;word-break:break-all}
.btn{display:inline-block;background:linear-gradient(135deg,#0044cc,#00e5ff);color:#fff;text-decoration:none;padding:16px 36px;border-radius:50px;font-weight:800;font-size:15px;margin-bottom:24px}
.note{font-size:12px;color:#6a7490;line-height:1.6}
.footer{margin-top:32px;font-size:11px;color:#6a7490}
</style></head><body>
<div class="wrap"><div class="card">
<div class="logo">🎉</div>
<h1>ACHAT CONFIRMÉ !</h1>
<p class="sub">Merci pour votre achat !</p>
<div class="title-box">«&nbsp;$title&nbsp;»</div>
<p style="font-size:13px;color:#a8b2c8;margin-bottom:8px">Votre clé de licence :</p>
<div class="license">$license</div>
<a href="$url" class="btn">📥 Télécharger mon livre</a>
<p class="note">Envoyé à <strong style="color:#00e5ff">$email</strong>.<br>Conservez cette licence précieusement.</p>
</div><p class="footer" style="text-align:center">© 2025 Empire Ebook · Tous droits réservés</p></div>
</body></html>
HTML;
    }
}
