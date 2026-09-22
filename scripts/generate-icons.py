from pathlib import Path
from PIL import Image, ImageDraw

output = Path(__file__).resolve().parent.parent / 'public' / 'icons'
output.mkdir(parents=True, exist_ok=True)
for size in (192, 512):
    scale = size / 512
    image = Image.new('RGB', (size, size), '#145c62')
    draw = ImageDraw.Draw(image)
    def b(box): return tuple(round(v * scale) for v in box)
    draw.ellipse(b((102, 102, 410, 410)), outline='white', width=round(21 * scale))
    draw.ellipse(b((186, 102, 326, 410)), outline='white', width=round(17 * scale))
    for y, left, right in ((256,102,410),(182,124,388),(330,124,388)):
        draw.line(b((left,y,right,y)), fill='white', width=round(17 * scale))
    draw.ellipse(b((313,146,369,202)), fill='#e2c083')
    image.save(output / f'icon-{size}.png')
