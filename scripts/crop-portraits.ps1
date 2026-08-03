Add-Type -AssemblyName System.Drawing

$cells = @(
  @{ col = 0; row = 0; slug = "apostata" },
  @{ col = 1; row = 0; slug = "swietlisty_obronca" },
  @{ col = 2; row = 0; slug = "mroczny_rycerz" },
  @{ col = 3; row = 0; slug = "najemnik_bractwa" },
  @{ col = 4; row = 0; slug = "berserk" },
  @{ col = 0; row = 1; slug = "lowca" },
  @{ col = 1; row = 1; slug = "skrytobojca" },
  @{ col = 2; row = 1; slug = "truciciel" },
  @{ col = 3; row = 1; slug = "medyk" },
  @{ col = 4; row = 1; slug = "arcymag" }
)

$sheets = @(
  @{ path = "J:\Claude\game\img\portret_kobieta.png"; prefix = "kobieta" },
  @{ path = "J:\Claude\game\img\portrety_mezczyzna.png"; prefix = "mezczyzna" }
)

$outDir = "J:\Claude\game\img\portraits"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]85)

foreach ($sheet in $sheets) {
  $img = [System.Drawing.Image]::FromFile($sheet.path)
  $w = $img.Width
  $h = $img.Height
  $colW = $w / 5.0
  $rowH = $h / 2.0

  foreach ($cell in $cells) {
    $x0 = [int][math]::Round($cell.col * $colW)
    $x1 = [int][math]::Round(($cell.col + 1) * $colW)
    $y0raw = $cell.row * $rowH
    $y1 = [int][math]::Round(($cell.row + 1) * $rowH)
    # Skip the top ~11% of each cell (title text band) so the face fills the frame
    $y0 = [int][math]::Round($y0raw + ($rowH * 0.135))
    $cw = [int]($x1 - $x0)
    $ch = [int]($y1 - $y0)

    $srcRect = New-Object System.Drawing.Rectangle($x0, $y0, $cw, $ch)
    $cropped = New-Object System.Drawing.Bitmap($cw, $ch)
    $g = [System.Drawing.Graphics]::FromImage($cropped)
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $cw, $ch)), $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    # Resize down to a reasonable max width for web use
    $targetW = 320
    $targetH = [int][math]::Round($ch * ($targetW / [double]$cw))
    $resized = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $g2 = [System.Drawing.Graphics]::FromImage($resized)
    $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g2.DrawImage($cropped, 0, 0, $targetW, $targetH)
    $g2.Dispose()
    $cropped.Dispose()

    $outPath = Join-Path $outDir "$($sheet.prefix)_$($cell.slug).jpg"
    $resized.Save($outPath, $jpegCodec, $encoderParams)
    $resized.Dispose()
    Write-Output "Saved $outPath"
  }

  $img.Dispose()
}
