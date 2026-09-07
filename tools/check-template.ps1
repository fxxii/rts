param([string]$Root = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path -LiteralPath $Root).Path
$problems = New-Object 'System.Collections.Generic.List[string]'
$required = @(
    'AGENTS.md', 'README.md', 'HANDOVER.md', '.gitignore',
    'docs/project.md', 'docs/workflow.md', 'docs/work-plan-template.md',
    'docs/behavioral-guidelines.md', 'docs/verification.md', 'docs/runtime-safety.md',
    'docs/model-dispatch.md', 'docs/delegation-templates.md', 'docs/judgment-rubrics.md',
    'docs/maintenance-protocol.md', 'docs/learnings.md', 'docs/astra-harness.md',
    'docs/decisions/README.md', 'docs/review-checklist.md', 'docs/domain-checks.md'
)
foreach ($relative in $required) {
    $path = Join-Path $Root $relative
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $problems.Add("Missing required file: $relative")
    }
}
$files = @(Get-ChildItem -LiteralPath $Root -File -Filter '*.md')
$docs = Join-Path $Root 'docs'
if (Test-Path -LiteralPath $docs) {
    $files += @(Get-ChildItem -LiteralPath $docs -File -Recurse -Filter '*.md')
}
$totalWords = 0
foreach ($file in $files) {
    $relative = $file.FullName.Substring($Root.Length + 1).Replace('\', '/')
    $content = [IO.File]::ReadAllText($file.FullName)
    if ([string]::IsNullOrWhiteSpace($content)) { $problems.Add("Empty file: $relative") }
    if ($content.Contains([char]0xFFFD)) { $problems.Add("Encoding replacement character: $relative") }
    $fences = [regex]::Matches($content, '(?m)^```').Count
    if ($fences % 2 -ne 0) { $problems.Add("Unbalanced code fences: $relative") }
    $words = [regex]::Matches($content, '\S+').Count
    $totalWords += $words
    $lines = ($content.TrimEnd() -split '\r?\n').Count
    if ($relative -eq 'AGENTS.md' -and ($lines -gt 60 -or $words -gt 700)) {
        $problems.Add("AGENTS.md over budget: $lines lines / $words words")
    }
    # Inline Markdown file links only; web URLs and anchor targets are not fetched.
    foreach ($match in [regex]::Matches($content, '\[[^\]\r\n]*\]\(([^)\r\n]+)\)')) {
        $target = $match.Groups[1].Value.Trim().Trim('<', '>')
        if ($target -match '^(https?://|mailto:|#)') { continue }
        $target = ($target -split '#', 2)[0]
        $resolved = Join-Path $file.DirectoryName ([Uri]::UnescapeDataString($target))
        if (-not (Test-Path -LiteralPath $resolved)) {
            $problems.Add("Broken link in ${relative}: $target")
        }
    }
    Write-Output ("{0}: {1} lines, {2} words" -f $relative, $lines, $words)
}
if ($problems.Count -gt 0) {
    $problems | ForEach-Object { Write-Output "FAIL: $_" }
    exit 1
}
Write-Output "PASS: $($files.Count) Markdown files read; required files and local links valid."
Write-Output "Total: $totalWords whitespace-delimited words (not tokenizer counts; guides load conditionally)."
Write-Output 'Limits: does not validate web links, Markdown anchors, model availability, or application behavior.'
