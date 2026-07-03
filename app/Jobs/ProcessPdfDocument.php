<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessPdfDocument implements ShouldQueue
{
    use Queueable;

    protected \App\Models\PdfUpload $upload;

    /**
     * Create a new job instance.
     */
    public function __construct(\App\Models\PdfUpload $upload)
    {
        $this->upload = $upload;
    }

    /**
     * Execute the job.
     */
    public function handle(\App\Services\DocumentProcessorService $processor): void
    {
        $processor->process($this->upload);
    }
}
