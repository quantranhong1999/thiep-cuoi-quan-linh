#!/usr/bin/env bash
# Builds web-ready assets (needs ffmpeg) from the design handoff and the photo library.
#   scripts/optimize-assets.sh [handoff assets dir] [photo library dir]
set -euo pipefail

here="$(cd "$(dirname "$0")/.." && pwd)"
src="${1:-$here/../design_handoff_thiep_cuoi/reference/assets}"
lib="${2:-$here/../Ảnh cưới}"
out="$here/assets"
rm -rf "$out/img"
mkdir -p "$out/img"

# Photos on the card: <name>=<source>. Handoff photos are pre-cropped (~960w); library originals
# (2126w) are scaled to 964w. Each gets a 640w variant for phones.
photos=(
  "p03-hero=$src/p03-hero.jpg"     # cover
  "n05=$src/n05.jpg"               # groom portrait
  "n03=$src/n03.jpg"               # bride portrait
  "p12-crop=$src/p12-crop.jpg"     # bride-side invitation
  "p04-crop=$src/p04-crop.jpg"     # interlude "Theo anh về xứ Nghệ"
  "tey09797=$lib/TEY09797.jpg"     # ceremony invitation
  "tey00241=$lib/TEY00241.jpg"     # album: couple
  "n04=$src/n04.jpg"
  "p07=$src/p07.jpg"
  "p15c=$src/p15c.jpg"
  "p13=$src/p13.jpg"
  "tey00811=$lib/TEY00811.jpg"     # album: confetti concept
  "tey00773=$lib/TEY00773.jpg"
  "tey00844=$lib/TEY00844.jpg"
  "p16=$src/p16.jpg"               # album: groom / bride, áo dài
  "p17=$src/p17.jpg"
  "tey00934=$lib/TEY00934.jpg"     # album: groom, studio / Save the Date, bride seated
  "n01=$src/n01.jpg"
  "tey09830=$lib/TEY09830.jpg"     # interlude "Hẹn gặp bạn nhé"
  "p08=$src/p08.jpg"               # thank-you footer
)
for entry in "${photos[@]}"; do
  name="${entry%%=*}"
  f="${entry#*=}"
  w="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$f")"
  if [ "$w" -gt 1000 ]; then
    ffmpeg -loglevel error -y -i "$f" -vf scale=964:-2:flags=lanczos -q:v 3 "$out/img/$name.jpg"
  else
    cp "$f" "$out/img/$name.jpg"
  fi
  ffmpeg -loglevel error -y -i "$f" -vf scale=640:-2:flags=lanczos -q:v 5 "$out/img/$name-640.jpg"
done

# Link preview (Zalo / Messenger / Facebook): 1.91:1 band around the faces of the cover photo.
ffmpeg -loglevel error -y -i "$src/p03-hero.jpg" -vf "crop=888:466:0:200" -q:v 3 "$out/og.jpg"

# Bank QR codes: 64-colour palette PNGs, same pixels, a fraction of the bytes.
for who in groom bride; do
  ffmpeg -loglevel error -y -i "$src/qr-$who.png" \
    -filter_complex "[0]split[a][b];[a]palettegen=max_colors=64:reserve_transparent=0[p];[b][p]paletteuse=dither=none" \
    "$out/qr-$who.png"
done

# Music: 320 kbps with cover art -> 128 kbps audio only (~10 MB -> ~4 MB) so it streams on 4G.
ffmpeg -loglevel error -y -i "$src/le-duong.mp3" -map 0:a -c:a libmp3lame -b:a 128k -ar 44100 "$out/le-duong.mp3"

du -sh "$out" "$out/img" "$out/le-duong.mp3" "$out"/qr-*.png "$out/og.jpg"
