$file = 'c:\Users\ayman\Desktop\00- بورتفوليو المكتب وعروض اسعار - 20-2-2026\0- منصة مجموعة معمار للاستشارات الهندسية\memar-platform-v2\erp\index.html'
$content = Get-Content $file -Raw -Encoding UTF8

$oldCSS = @"
/* Record row (السجل السابق) */
.appt-record-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  transition: background .12s;
}
.appt-record-row:last-child { border-bottom: none; }
.appt-record-row:hover { background: var(--bg); }
.appt-record-actions { display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; margin-top: 3px; }
.appt-action-btn {
  width: 27px; height: 27px; border-radius: 7px;
  border: 1px solid var(--border); background: #fff;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 11px; transition: border-color .15s, background .15s;
}
.appt-action-btn:hover          { border-color: var(--primary); background: var(--primary-50); }
.appt-action-btn.delete:hover   { border-color: var(--danger);  background: var(--danger-50);  }
.appt-record-content { flex: 1; min-width: 0; }
.appt-record-title   { font-size: 14px; font-weight: 800; color: var(--text); margin-bottom: 3px; }
.appt-record-client  { font-size: 12px; color: var(--text-3); margin-bottom: 6px; }
.appt-record-tags    { display: flex; flex-wrap: wrap; gap: 5px; }
.appt-record-meta    { text-align: left; flex-shrink: 0; }
.appt-record-time    { font-size: 15px; font-weight: 900; color: var(--text); font-family: 'Inter', sans-serif; }
.appt-record-date    { font-size: 11px; color: var(--text-3); margin-top: 3px; }
"@

$newCSS = @"
/* Record row (السجل السابق) */
.appt-record-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--divider);
  transition: background .12s;
}
.appt-record-row:last-child { border-bottom: none; }
.appt-record-row:hover { background: var(--bg); }

/* Time + Date — right side in RTL (outermost) */
.appt-record-meta    { text-align: right; flex-shrink: 0; min-width: 76px; }
.appt-record-time    { font-size: 16px; font-weight: 900; color: var(--text); font-family: 'Inter', monospace; line-height: 1.2; }
.appt-record-date    { font-size: 10.5px; color: var(--text-3); margin-top: 3px; }

/* Content — center grows */
.appt-record-content { flex: 1; min-width: 0; }
.appt-record-title   { font-size: 14px; font-weight: 800; color: var(--text); margin-bottom: 3px; }
.appt-record-client  { font-size: 12px; color: var(--text-3); margin-bottom: 7px; }
.appt-record-tags    { display: flex; flex-wrap: wrap; gap: 5px; }

/* Actions — left side in RTL (innermost edge) */
.appt-record-actions { display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }
.appt-action-btn {
  width: 28px; height: 28px; border-radius: 7px;
  border: 1px solid var(--border); background: #fff;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 12px; transition: border-color .15s, background .15s;
}
.appt-action-btn:hover          { border-color: var(--primary); background: var(--primary-50); }
.appt-action-btn.delete:hover   { border-color: var(--danger);  background: var(--danger-50);  }
"@

if ($content.Contains($oldCSS)) {
    $content = $content.Replace($oldCSS, $newCSS)
    Set-Content $file $content -NoNewline -Encoding UTF8
    Write-Host "SUCCESS: CSS updated"
} else {
    Write-Host "FALLBACK: old CSS not found exactly, searching for partial match..."
    $idx = $content.IndexOf('.appt-record-row {')
    Write-Host "  .appt-record-row at idx: $idx"
    $idx2 = $content.IndexOf('.appt-action-btn.delete:hover', $idx)
    Write-Host "  delete:hover at idx: $idx2"
    if ($idx -gt 0 -and $idx2 -gt 0) {
        $endIdx = $idx2 + '.appt-action-btn.delete:hover   { border-color: var(--danger);  background: var(--danger-50);  }'.Length
        $before = $content.Substring(0, $idx)
        $after  = $content.Substring($endIdx)
        $content = $before + $newCSS.TrimStart() + $after
        Set-Content $file $content -NoNewline -Encoding UTF8
        Write-Host "SUCCESS via fallback"
    }
}
