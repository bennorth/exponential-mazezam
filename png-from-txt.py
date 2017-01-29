# Quick hack to turn text file into PNG.
# Written by Ben North, 2017.
# Hereby placed into the public domain.

from PIL import Image
import numpy as np
import sys

txt_lines = [line.rstrip() for line in sys.stdin]

pxls_per_cell = 10

n_rows = len(txt_lines)
n_colss = set(map(len, txt_lines))
if len(n_colss) != 1:
    raise RuntimeError('mismatched lengths')
n_cols = n_colss.pop()

n_pxl_rows = pxls_per_cell * n_rows
n_pxl_cols = pxls_per_cell * n_cols

lum_f_ch = {'.': 0, '*': 128, 'X': 192}

lvl_img = np.zeros((n_pxl_rows, n_pxl_cols), dtype = np.uint8)
for i, line in enumerate(txt_lines):
    prow_0 = i * pxls_per_cell
    for j, ch in enumerate(line):
        pcol_0 = j * pxls_per_cell
        lvl_img[prow_0 : prow_0 + pxls_per_cell,
                pcol_0 : pcol_0 + pxls_per_cell] = lum_f_ch[ch]

im = Image.fromarray(lvl_img, mode = 'L')
im.save('6-bar-sample.png')

y0 = 0
for i, dp in enumerate([5, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 4]):
    y1 = y0 + dp * pxls_per_cell
    # Shorten the movable slices, identified by their single-unit depth:
    x1 = im.size[0] - (pxls_per_cell if dp == 1 else 0)
    im_slice = im.crop((0, y0, x1, y1))
    im_slice.save('gray-slice-{:02}.png'.format(i))
    y0 = y1
