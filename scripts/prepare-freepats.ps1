# Pass the extracted directories that contain the FreePats SFZ and samples/ files.
param(
    [Parameter(Mandatory)][string]$PianoSource,
    [Parameter(Mandatory)][string]$GuitarSource
)
$ErrorActionPreference = 'Stop'
$out = Join-Path (Split-Path $PSScriptRoot -Parent) 'assets/audio/freepats'
New-Item -ItemType Directory -Force -Path $out | Out-Null

function Convert-Bank($name, $source, $roots, $length, $channels, $bitrate, $target) {
    $sfz = Get-ChildItem -LiteralPath $source -Filter '*.sfz' | Select-Object -First 1
    if (-not $sfz) { throw "No SFZ metadata found in $source" }
    $regions = (Get-Content -Raw -LiteralPath $sfz.FullName) -split '<region>'
    foreach ($root in $roots) {
        $region = $regions | Where-Object { $_ -match "(?m)^\s*(?:key|pitch_keycenter)=$root\s*$" } | Select-Object -First 1
        if ($region -notmatch '(?m)^\s*sample=(.+)$') { throw "Missing source sample for $name MIDI $root" }
        $inputFile = Join-Path $source $Matches[1].Trim()
        $outputFile = Join-Path $out "$name-$root.mp3"
        $duration = [double]::Parse((ffprobe -v error -show_entries format=duration -of 'default=nw=1:nk=1' $inputFile), [cultureinfo]::InvariantCulture)
        $end = [math]::Min($duration, $length)
        $endArg = $end.ToString('0.###', [cultureinfo]::InvariantCulture)
        $fade = [math]::Max(0, $end - 0.22).ToString('0.###', [cultureinfo]::InvariantCulture)
        $probe = & {
            $ErrorActionPreference = 'Continue'
            ffmpeg -i $inputFile -t $endArg -ac $channels -af volumedetect -f null NUL 2>&1 | Out-String
        }
        if ($probe -notmatch 'max_volume:\s+(-?[\d.]+) dB') { throw "Cannot measure peak of $inputFile" }
        $peak = [double]::Parse($Matches[1], [cultureinfo]::InvariantCulture)
        $gain = [math]::Min(9, $target - $peak).ToString('0.###', [cultureinfo]::InvariantCulture)
        ffmpeg -loglevel error -y -i $inputFile -t $endArg -ac $channels -ar 44100 `
            -af "volume=${gain}dB,afade=t=out:st=${fade}:d=0.22" -map_metadata -1 -codec:a libmp3lame -b:a $bitrate $outputFile
        if ($LASTEXITCODE -ne 0) { throw "Failed to encode $outputFile" }
        Write-Output "$name MIDI $root <- $(Split-Path $inputFile -Leaf)"
    }
}

Convert-Bank 'piano' $PianoSource @(36,42,48,54,60,66,72,78,84,90,96) 4.2 2 '128k' -5
Convert-Bank 'guitar' $GuitarSource @(36,43,48,54,60,66,72,78,84) 3.2 1 '96k' -7
