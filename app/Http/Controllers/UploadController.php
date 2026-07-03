<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\PdfUpload;
use App\Jobs\ProcessPdfDocument;
use Illuminate\Support\Facades\Auth;

class UploadController extends Controller
{
    /**
     * Store a newly uploaded PDF and dispatch processing job
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:102400', // 100MB Limit
            'category_id' => 'required|exists:categories,id',
        ]);

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        
        // Store in storage/app/private/pdfs
        $filePath = $file->store('pdfs');

        $upload = PdfUpload::create([
            'user_id' => Auth::id(),
            'category_id' => $request->category_id,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'status' => 'processing',
            'chat_history' => [],
        ]);

        // Dispatch background processing job
        ProcessPdfDocument::dispatch($upload);

        return response()->json([
            'message' => 'Upload successful. Processing has started.',
            'upload' => $upload,
        ]);
    }

    /**
     * Expose upload status polling endpoint
     */
    public function status(PdfUpload $pdfUpload)
    {
        // Auth gate
        if ($pdfUpload->user_id !== Auth::id()) {
            abort(403);
        }

        return response()->json([
            'id' => $pdfUpload->id,
            'status' => $pdfUpload->status,
            'file_name' => $pdfUpload->file_name,
        ]);
    }
}
