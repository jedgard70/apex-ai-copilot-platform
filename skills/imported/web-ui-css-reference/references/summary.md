# Web UI CSS Reference Summary

External CSS audit performed against `D:\AI Jedgard\skill`.

## Classification

- Total CSS files found: 36.
- Total approximate size: 3.6 MB.
- Most files appear to be minified UI/component exports.
- Files include chat/message UI, form controls, code blocks, modals, map/data visualization, and vendor-style assets.
- A Google OAuth console page CSS asset was detected and should remain excluded from Apex runtime styling.

## Representative Files

- `root-m1safcvj.css` and `root-m1safcvj(1).css`: large duplicated root/style bundles.
- `AssistantMessage-lplwfziw.css`: assistant message surface styles.
- `conversation-small-mmomz9vs.css`: conversation UI styles.
- `Input-eusic68p.css`, `Select-evd90x7j.css`, `SegmentedControl-nay8rogw.css`: control styles.
- `ADAVisualizationComponent-m14wkthf.css`: data/grid visualization styles.
- `mapbox-gl-l6rc2zka.css`: Mapbox vendor-style map CSS.
- `silk-hq-jrmbfqt7.css`: overlay/modal/sheet style patterns.

## Integration Decision

Do not copy these minified CSS files into active runtime styling automatically. Use them as visual/UI references and reimplement useful patterns in Apex-native components after review.
