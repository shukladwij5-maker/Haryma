$port = 8080
$ip = "192.168.1.2"
$listener = New-Object System.Net.HttpListener
try {
    $listener.Prefixes.Add("http://${ip}:${port}/")
    $listener.Start()
    Write-Host "Server started at http://${ip}:${port}/"
    Write-Host "Press Ctrl+C to stop."
} catch {
    Write-Error "Failed to start server: $_"
    Write-Host "Try running this script as Administrator."
    exit
}

while ($listener.IsListening) {
    $context = $listener.BeginGetContext($null, $null).AsyncWaitHandle.WaitOne()
    $context = $listener.EndGetContext($context)
    $request = $context.Request
    $response = $context.Response

    $path = $request.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }
    $localPath = Join-Path $PWD $path
    
    if (Test-Path $localPath -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($localPath)
        $response.ContentLength64 = $bytes.Length
        
        if ($localPath.EndsWith(".html")) { $response.ContentType = "text/html" }
        elseif ($localPath.EndsWith(".css")) { $response.ContentType = "text/css" }
        elseif ($localPath.EndsWith(".js")) { $response.ContentType = "application/javascript" }
        elseif ($localPath.EndsWith(".jpg")) { $response.ContentType = "image/jpeg" }
        
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $response.StatusCode = 404
    }
    
    $response.Close()
}
