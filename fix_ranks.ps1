$content = Get-Content 'orgchart.html' -Raw

# Replace all remaining officers with their rank titles
$content = $content -replace '(<h4>Capt\. Harris</h4>)\s*(<button)', '$1`n                            <p>Captain</p>`n                            $2'
$content = $content -replace '(<h4>Capt\. Martin</h4>)\s*(<button)', '$1`n                            <p>Captain</p>`n                            $2'
$content = $content -replace '(<h4>Capt\. Thompson</h4>)\s*(<button)', '$1`n                            <p>Captain</p>`n                            $2'
$content = $content -replace '(<h4>Capt\. Garcia</h4>)\s*(<button)', '$1`n                            <p>Captain</p>`n                            $2'
$content = $content -replace '(<h4>Commander Martinez</h4>)\s*(<button)', '$1`n                            <p>Commander</p>`n                            $2'
$content = $content -replace '(<h4>Commander Robinson</h4>)\s*(<button)', '$1`n                            <p>Commander</p>`n                            $2'
$content = $content -replace '(<h4>Commander Clark</h4>)\s*(<button)', '$1`n                            <p>Commander</p>`n                            $2'
$content = $content -replace '(<h4>Lt\. Cmdr\. Walker</h4>)\s*(<button)', '$1`n                            <p>Lieutenant Commander</p>`n                            $2'
$content = $content -replace '(<h4>Lt\. Cmdr\. Hall</h4>)\s*(<button)', '$1`n                            <p>Lieutenant Commander</p>`n                            $2'
$content = $content -replace '(<h4>Lt\. Cmdr\. Allen</h4>)\s*(<button)', '$1`n                            <p>Lieutenant Commander</p>`n                            $2'

# Replace all remaining ℹ️ with +
$content = $content -replace 'ℹ️', '+'

Set-Content 'orgchart.html' $content
