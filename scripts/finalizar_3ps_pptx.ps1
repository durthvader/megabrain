param(
    [string]$PptxPath = "$(Join-Path $PSScriptRoot '..\outputs\3ps\3Ps_Ceara_Executivo.pptx')"
)

$ErrorActionPreference = 'Stop'
$resolved = (Resolve-Path -LiteralPath $PptxPath).Path
$powerPoint = New-Object -ComObject PowerPoint.Application

try {
    $presentation = $powerPoint.Presentations.Open($resolved, $false, $false, $false)
    foreach ($slide in $presentation.Slides) {
        foreach ($shape in $slide.Shapes) {
            if ($shape.HasChart -eq -1) {
                $series = $shape.Chart.SeriesCollection()
                for ($index = 1; $index -le $series.Count; $index++) {
                    $series.Item($index).HasDataLabels = $false
                }
            }
        }
    }
    $presentation.Save()
    $presentation.Close()
}
finally {
    $powerPoint.Quit()
}

