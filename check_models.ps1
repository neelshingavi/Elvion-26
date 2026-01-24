$envContent = Get-Content .env.local -Raw
$apiKey = $null
if ($envContent -match 'GEMINI_API_KEY=(.*)') {
    $apiKey = $matches[1].Trim().Trim('"').Trim("'")
}

if ($apiKey) {
    Write-Host "Checking models for key..."
    $response = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models?key=$apiKey" -Method Get
    $response.models | Where-Object { $_.name -like "*gemini*" } | ForEach-Object { Write-Host $_.name }
} else {
    Write-Host "No API Key found."
}
