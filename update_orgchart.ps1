# PowerShell script to update org chart structure
$content = Get-Content "orgchart.html" -Raw

# Replace the pattern for all officer cards
$pattern = '(<img src="[^"]+"\s+alt="[^"]+">)\s*(<h4>[^<]+</h4>)\s*(<p>[^<]+</p>)'
$replacement = '$1<div class="officer-content">$2$3</div>'

$content = $content -replace $pattern, $replacement

# Write back to file
$content | Set-Content "orgchart.html" -NoNewline

Write-Host "Updated orgchart.html with new structure"
