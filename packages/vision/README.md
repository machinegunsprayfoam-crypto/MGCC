# @mgcc/vision

Image sizing math for [Claude vision](https://docs.anthropic.com/en/docs/build-with-claude/vision):
the visual-token cost of an image, the exact resize Claude applies before it
sees an image, and coordinate rescaling so bounding boxes and points line up
with your original image. Pure functions, **no dependencies**.

Use it for OCR / form extraction / chart parsing / UI-element location — any
task where you act on a region Claude points to — and for sizing screenshots for
the computer use tool.

## Token cost and resize

```ts
import { countImageTokens, resizedSize, tierForModel } from "@mgcc/vision";

countImageTokens(1000, 1000); // 1296  (⌈w/28⌉·⌈h/28⌉)

// The size Claude downsizes to before padding (standard tier by default):
resizedSize(1075, 1520); // { width: 924, height: 1307 }
//   both sides < 1568px, but 39·55 = 2145 tokens > 1568 → it downsizes.

// Pick the tier from the model id (high-res: Fable 5, Mythos 5, Opus 4.8/4.7, Sonnet 5):
resizedSize(1920, 1080, tierForModel("claude-opus-4-8")); // { width: 1920, height: 1080 }
```

Resize your image to `resizedSize(...)` **before uploading** and Claude's
returned pixel coordinates map 1:1 onto the image you sent — no conversion. Ask
for **absolute pixel coordinates** in your prompt (Claude does poorly with
normalized ones).

## Rescale coordinates (when you can't pre-resize)

Claude returns coordinates in the *resized* image space. Map them back:

```ts
import {
  toRelativeCoordinates,
  toOriginalCoordinates,
  boxToOriginalCoordinates,
} from "@mgcc/vision";

// Normalize to [0,1] by the resized (not padded, not original) dimensions:
toRelativeCoordinates(x, y, originalWidth, originalHeight);

// Or map straight back to your original image's pixel space:
toOriginalCoordinates(x, y, originalWidth, originalHeight);

// Rescale a whole [x1,y1,x2,y2] box Claude returned:
boxToOriginalCoordinates({ x1, y1, x2, y2 }, originalWidth, originalHeight);
```

Padding is applied only to the bottom/right edges, so a per-axis linear rescale
by the resized dimensions is exact. (Pass a tier as the last arg for high-res
models. PDF pages are rasterized server-side at dimensions you don't control —
rasterize them yourself and use the pre-resize approach.)

## Computer use screenshots

The computer use tool uses long-edge + total-pixel limits (not the token
budget), and you resize client-side so you keep the scale factor:

```ts
import {
  scaledScreenshotSize,
  scaleCoordinateToScreen,
} from "@mgcc/vision";

const { width, height, scale } = scaledScreenshotSize(screenW, screenH);
// send width/height as display_width_px/display_height_px; resize the screenshot to them.

// Map a coordinate Claude returned back to real screen space:
const { x, y } = scaleCoordinateToScreen(claudeX, claudeY, scale);
```

Defaults are the older-model limits (1568 px long edge, ~1.15 MP). Pass
`{ maxLongEdge, maxPixels }` for newer models (2576 px long edge). On macOS
Retina (device pixel ratio 2), halve the returned coordinates or downscale the
screenshot 2× first.

## API

| Function | Returns |
| --- | --- |
| `countImageTokens(w, h)` | visual tokens (`⌈w/28⌉·⌈h/28⌉`) |
| `resizedSize(w, h, tier?)` | `{ width, height }` Claude resizes to |
| `fitsWithinTier(w, h, tier?)` | whether no resize is needed |
| `tierForModel(model)` | `STANDARD_TIER` or `HIGH_RESOLUTION_TIER` |
| `toRelativeCoordinates(x, y, ow, oh, tier?)` | `{ x, y }` in [0,1] |
| `toOriginalCoordinates(x, y, ow, oh, tier?)` | `{ x, y }` in original pixels |
| `boxToOriginalCoordinates(box, ow, oh, tier?)` | rescaled `{ x1,y1,x2,y2 }` |
| `screenshotScaleFactor(w, h, limits?)` | scale ≤ 1 for computer use |
| `scaledScreenshotSize(w, h, limits?)` | `{ width, height, scale }` |
| `scaleCoordinateToScreen(x, y, scale)` | `{ x, y }` in screen space |

## Scripts

```bash
pnpm --filter @mgcc/vision build
pnpm --filter @mgcc/vision typecheck
pnpm --filter @mgcc/vision test
```
