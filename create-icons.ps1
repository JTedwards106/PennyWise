Add-Type -AssemblyName System.Drawing

$sizes = @(16, 32, 48, 128)

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Fill background with green
    $graphics.Clear([System.Drawing.Color]::FromArgb(34, 197, 94))
    
    # Create font
    $fontSize = [math]::Floor($size / 3)
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    
    # Create brush for text
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    
    # Draw text
    $textX = [math]::Floor($size / 6)
    $textY = [math]::Floor($size / 6)
    $graphics.DrawString("PW", $font, $brush, $textX, $textY)
    
    # Save
    $bmp.Save("public/icons/icon$size.png")
    
    # Cleanup
    $graphics.Dispose()
    $font.Dispose()
    $brush.Dispose()
    $bmp.Dispose()
    
    Write-Host "Created icon$size.png"
}

Write-Host "All icons created successfully!"
