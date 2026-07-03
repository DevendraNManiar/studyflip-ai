<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\PdfUpload;
use App\Services\GeminiAiService;
use Illuminate\Support\Facades\Auth;

class AiTutorController extends Controller
{
    protected GeminiAiService $aiService;

    public function __construct(GeminiAiService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Send message to the study tutor
     */
    public function chat(Request $request, PdfUpload $pdfUpload)
    {
        // Auth gate
        if ($pdfUpload->user_id !== Auth::id()) {
            abort(403);
        }

        $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        $userMessage = $request->message;
        $chatHistory = $pdfUpload->chat_history ?? [];

        // Generate response from AI tutor
        $tutorResponse = $this->aiService->generateTutorResponse(
            $pdfUpload->extracted_text ?? '',
            $chatHistory,
            $userMessage
        );

        // Update history
        $chatHistory[] = [
            'role' => 'user',
            'content' => $userMessage,
            'timestamp' => now()->toIso8601String()
        ];
        $chatHistory[] = [
            'role' => 'tutor',
            'content' => $tutorResponse,
            'timestamp' => now()->toIso8601String()
        ];

        $pdfUpload->update([
            'chat_history' => $chatHistory
        ]);

        return response()->json([
            'message' => 'Response generated.',
            'response' => $tutorResponse,
            'chat_history' => $chatHistory
        ]);
    }

    /**
     * Clear the conversation history
     */
    public function clear(PdfUpload $pdfUpload)
    {
        if ($pdfUpload->user_id !== Auth::id()) {
            abort(403);
        }

        $pdfUpload->update(['chat_history' => []]);

        return response()->json([
            'message' => 'Chat history cleared.',
            'chat_history' => []
        ]);
    }
}
