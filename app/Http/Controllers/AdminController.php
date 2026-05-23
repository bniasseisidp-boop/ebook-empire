<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Book;
use App\Models\Download;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    /* ── POST /api/admin/login ── */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $admin = Admin::where('username', $request->username)->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            return response()->json(['message' => 'Identifiants incorrects'], 401);
        }

        $token = base64_encode($admin->id . ':' . hash('sha256', $admin->password . config('app.key')));

        return response()->json(['token' => $token, 'username' => $admin->username]);
    }

    /* ── POST /api/admin/books ── */
    public function uploadBook(Request $request)
    {
        $request->validate([
            'title'    => 'required|string|max:255',
            'pdf'      => 'required|file|mimes:pdf|max:102400',
            'cover'    => 'nullable|image|max:5120',
            'price'    => 'nullable|numeric|min:0',
            'category' => 'nullable|string',
        ]);

        $pdfFile = $request->file('pdf');
        $filename = \Str::uuid() . '.pdf';
        $pdfFile->storeAs('books', $filename);

        $coverFilename = null;
        if ($request->hasFile('cover')) {
            $coverFilename = \Str::uuid() . '.' . $request->file('cover')->extension();
            $request->file('cover')->storeAs('covers', $coverFilename, 'public');
        }

        $isFree = $request->boolean('is_free') || (float)($request->price ?? 0) == 0;

        $book = Book::create([
            'title'       => $request->title,
            'description' => $request->description ?? '',
            'price'       => $isFree ? 0 : (float)($request->price ?? 0),
            'is_free'     => $isFree,
            'filename'    => $filename,
            'cover_image' => $coverFilename,
            'category'    => $request->category ?? 'Général',
        ]);

        return response()->json(['success' => true, 'id' => $book->id], 201);
    }

    /* ── GET /api/admin/books ── */
    public function books()
    {
        return response()->json(Book::orderByDesc('created_at')->get());
    }

    /* ── PUT /api/admin/books/{id} ── */
    public function updateBook(Request $request, Book $book)
    {
        $book->update($request->only('title','description','price','is_free','category'));
        return response()->json(['success' => true]);
    }

    /* ── DELETE /api/admin/books/{id} ── */
    public function deleteBook(Book $book)
    {
        // Remove PDF from storage
        if ($book->filename) {
            Storage::delete("books/{$book->filename}");
        }
        if ($book->cover_image) {
            Storage::disk('public')->delete("covers/{$book->cover_image}");
        }
        $book->delete();
        return response()->json(['success' => true]);
    }

    /* ── GET /api/admin/downloads ── */
    public function downloads(Request $request)
    {
        $dl = Download::with('book:id,title')
            ->orderByDesc('created_at')
            ->paginate(100);

        return response()->json($dl->through(fn($d) => [
            'id'         => $d->id,
            'email'      => $d->email,
            'book_title' => $d->book?->title,
            'ip_address' => $d->ip_address,
            'created_at' => $d->created_at,
        ]));
    }

    /* ── GET /api/admin/purchases ── */
    public function purchases(Request $request)
    {
        $p = Purchase::with('book:id,title')
            ->orderByDesc('created_at')
            ->paginate(100);

        return response()->json($p->through(fn($x) => [
            'id'          => $x->id,
            'email'       => $x->email,
            'book_title'  => $x->book?->title,
            'amount'      => $x->amount,
            'status'      => $x->status,
            'license_key' => $x->license_key,
            'created_at'  => $x->created_at,
        ]));
    }

    /* ── GET /api/admin/stats ── */
    public function stats()
    {
        $totalBooks     = Book::count();
        $freeBooks      = Book::where('is_free', true)->count();
        $totalDownloads = Book::sum('download_count');
        $totalPurchases = Book::sum('purchase_count');
        $totalRevenue   = Purchase::where('status','completed')->sum('amount');
        $pendingPurchases = Purchase::where('status','pending')->count();

        $topBooks = Book::select('id','title','purchase_count','download_count')
            ->orderByDesc('purchase_count')->limit(5)->get();

        $recent = \DB::select("
            SELECT 'download' as type, email, (SELECT title FROM books WHERE id=book_id) as title, created_at
            FROM downloads
            UNION ALL
            SELECT 'purchase', email, (SELECT title FROM books WHERE id=book_id), created_at
            FROM purchases
            ORDER BY created_at DESC
            LIMIT 20
        ");

        return response()->json([
            'total_books'       => $totalBooks,
            'free_books'        => $freeBooks,
            'total_downloads'   => $totalDownloads,
            'total_purchases'   => $totalPurchases,
            'total_revenue'     => $totalRevenue,
            'pending_purchases' => $pendingPurchases,
            'top_books'         => $topBooks,
            'recent_activity'   => $recent,
        ]);
    }

    /* ── GET /api/admin/chart-data ── */
    public function chartData()
    {
        $downloads = \DB::select("
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM downloads
            WHERE created_at >= DATE('now', '-30 days')
            GROUP BY DATE(created_at)
            ORDER BY date
        ");

        $purchases = \DB::select("
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM purchases
            WHERE created_at >= DATE('now', '-30 days') AND status = 'completed'
            GROUP BY DATE(created_at)
            ORDER BY date
        ");

        return response()->json([
            'daily_downloads' => $downloads,
            'daily_purchases' => $purchases,
        ]);
    }
}
