$port = 8080
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
try {
    $listener.Start()
    Write-Host "Server started on http://0.0.0.0:$port"
    Write-Host "You can access it at http://192.168.1.2:$port/"
    Write-Host "Press Ctrl+C to stop."
}
catch {
    Write-Error "Failed to start listener: $_"
    Write-Host "Port $port might be in use."
    exit
}

while ($true) {
    if ($listener.Pending()) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        
        # Read request
        $buffer = New-Object byte[] 4096
        $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
        $request = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $bytesRead)
        
        # Parse first line: GET /path HTTP/1.1
        $reqLine = $request.Split("`n")[0]
        $parts = $reqLine.Split(" ")
        if ($parts.Length -gt 1) {
            $path = $parts[1]
            if ($path -eq "/") { $path = "/index.html" }
            $localPath = Join-Path $PWD $path
            $localPath = $localPath.TrimStart("/") # Ensure relative
            
            # Basic security: prevent .. traversal
            if ($localPath -like "*..*") { $responseStatus = "403 Forbidden"; $content = [System.Text.Encoding]::UTF8.GetBytes("Forbidden") }
            elseif (Test-Path $PWD/$path -PathType Leaf) {
                $fileBytes = [System.IO.File]::ReadAllBytes("$PWD/$path")
                $responseStatus = "200 OK"
                 
                # MIME
                $contentType = "text/plain"
                if ($path.EndsWith(".html")) { $contentType = "text/html" }
                elseif ($path.EndsWith(".css")) { $contentType = "text/css" }
                elseif ($path.EndsWith(".js")) { $contentType = "application/javascript" }
                 
                $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($fileBytes.Length)`r`nConnection: close`r`n`r`n"
                $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                $stream.Write($headerBytes, 0, $headerBytes.Length)
                $stream.Write($fileBytes, 0, $fileBytes.Length)
            }
            else {
                $responseStatus = "404 Not Found"
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $header = "HTTP/1.1 404 Not Found`r`nContent-Length: $($msg.Length)`r`nConnection: close`r`n`r`n"
                $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                $stream.Write($headerBytes, 0, $headerBytes.Length)
                $stream.Write($msg, 0, $msg.Length)
            }
        }
        $client.Close()
    }
    Start-Sleep -Milliseconds 10
}
