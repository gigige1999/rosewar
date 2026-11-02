# 《玫瑰战争》插画制作与替换指南

**2026-11-02 接图更新**：用户已将13张成品放入 `assets/art/export-5/`，并授权全部接入。`assets/art.js` 已按原文件名登记，清单标记为可用。实际章图为1200×896、人物为896×1200；网页改用完整构图显示，章图不再按扁横幅强行裁切。以下留白状态和生成提示词保留为制作历史，不表示当前缺图；模型与生成记录由用户提供前仍未知。

当前制作请优先使用 [配图素材表与提示词](配图素材表与提示词.md)：已整理13张图的中文完整提示词、复用位置，以及适配第三版扁横画位的2:1章节原图和中央横带裁切要求。本文下方的4:3英文章节提示词保留为早期构图草案，不再作为当前尺寸规范；人物仍使用3:4。

## 当前交付状态 · v3

用户最新要求「内页配图不用自己画，留出位置即可，只是游戏的部分需要画」。因此第三版已经撤下自绘章节画与人物纹章肖像，内页保留安静的图版画位；只继续绘制可操作的游戏素材。当前**没有调用图像生成模型，也没有产生 AI 场景画或人物肖像**。

- `assets/art-frames.js`：人物章节、全景、卷首与尾声使用的预留画位；无叙事 SVG，未来可填本地图片。
- `assets/chronicle-scenes.js`：第二版的七幅原创 SVG 叙事画作为历史文件保留，**不再由网页加载或展示**。
- `minigames.js` / `mixed-activities.js`：游戏所需地图、天平、日轮、烛光密信、棋盘、织锦，以及补给、记忆封印、旋转道路、纸片、风向射箭与徽记配对素材。对应 CSS 文件负责统一纸墨色板。
- `assets/ornaments.js`：仍用于封面与过场玫瑰、人物选项的小图标和界面装饰。人物肖像位置留白，不使用纹章冒充肖像。

下文仍保留 **13 幅未来 AI 图片的完整提示词：7 幅章节画、6 幅人物肖像**。文件清单与无障碍描述见 `assets/art-manifest.json`；清单的 `available: false` 与 `awaiting-ai-illustration` 表示位图尚未制作。AI 生图继续延期，请不要自行用远程图片、库存照片或自绘叙事画填充当前画位。

## 第二版归档图版（当前不展示）

| 索引 | 年份 | 当前原创 SVG 构图 |
| --- | --- | --- |
| 0 | 1455 | 圣奥尔本斯集市街道、城门、两侧持剑人物与裂冠 |
| 1 | 1461 | 风雪山坡、弓手、相向旗帜与寒冷的日轮 |
| 2 | 1471 | 雾带、拱窗与长桌上的三封黑蜡信 |
| 3 | 1483 | 两座空塔、双灯、书与小鞋；不呈现王子结局 |
| 4 | 1485 | 白野猪旗、军队剪影、遗落兵器与坠冠 |
| 5 | 1486 | 教堂圆拱、相接的双手与交缠的红白玫瑰 |
| 6 | 1487 | 破旗、旧头盔、新芽与远方城镇 |

这些画面是原创寓意构图，不是考古复原、历史现场记录或图像模型输出。三封信、空塔中的成对物件、坠冠与联枝等元素是叙事隐喻；不能据它们增添未经证实的事件。未来位图提示词与当前矢量画的具体物件可以不同，但必须保持同一章节主题与历史边界；替换时同步核对图注及无障碍描述。

## 统一画面语言

- **构图**：平面中世纪宗教画与手抄本边饰的庄严秩序，略显奇异、静默、克制的叙事气氛；稀疏元素，清晰剪影，有限的视觉纵深。参考复古解谜游戏的简洁与不安感，不复制现有游戏角色、场景或画面。
- **材质**：仿旧羊皮纸底，蛋彩般平涂，细微干笔与裂纹，轻度套色偏移。肌理应从属于主体，不制造一层遮挡内容的脏噪点。
- **配色**：深酒红 `#722D35`、炭褐 `#302A25`、羊皮白 `#E7DCC2`、旧金 `#A58A56`，极少量灰绿 `#676B51`。保持低饱和，避免鲜红、纯黑、发光金属。
- **光线与空间**：柔和、近乎没有方向的光。物件以细线轮廓和色面分层。不要写实摄影光、3D、体积雾、电影景深或现代油画堆叠。
- **历史边界**：使用 15 世纪后半叶英格兰及法兰德斯影响下的衣冠、甲胄、哥特式建筑。不要都铎晚期褶领、16 世纪巨大裙撑、维多利亚服装、幻想盔甲。人物画像为历史解读，不能宣称是经考证的真实容貌。
- **符号边界**：红白玫瑰在书中是帮助理解两支王族与后世记忆的叙事符号，不暗示所有参战者每场战役都统一佩戴红／白玫瑰。都铎双层玫瑰用于结局、封面或后世回望。伦敦塔诸王子命运未定，不画出确定的凶手或谋杀过程。
- **输出**：章节横幅 4:3（建议 1600×1200），人物竖幅 3:4（建议 1200×1600），JPG，sRGB，适度压缩。主体距四边至少 8%，允许书页轻微裁切。若模型仅支持固定比例，生成最接近的尺寸后再裁切。
- **禁止项**：无文字、字母、数字、标题、题签、可读手稿、品牌、水印、签名、UI、现代物品。不要把整本书或设备画进插画，只生成画心。避免写实血腥细节。

## 章节插画 · 7 幅

### C01 · 圣奥尔本斯，1455

文件：`assets/art/01-st-albans.jpg` · 4:3

**提示词**

Create one horizontal historical illustration, 4:3, as a sparse late medieval English devotional panel painted in flat tempera on aged parchment. The first Battle of St Albans, 1455: a narrow English market street seen frontally, simplified timber-framed houses closing toward a small Gothic church. In the foreground a tilted small gold crown rests on a broken wooden bench; two quiet, partly lowered heraldic banners stand on opposite edges, one deep burgundy, one parchment ivory. A few tiny late-fifteenth-century armed silhouettes remain distant, no active fighting. The crown, the empty street, and the distance between the banners carry the story of royal authority beginning to fracture. Calm symmetrical composition with a slight unsettling imbalance, fine charcoal-brown contours, flat low-saturation color fields, subtle rubbed pigment and hairline age cracks, sparse old-gold details. Palette: burgundy #722D35, parchment #E7DCC2, dark umber #302A25, muted old gold #A58A56. Authentic English architecture and clothing of 1455. Restrained uncanny narrative, flat medieval religious painting, no copied game imagery. Keep key objects inside an 8% safe margin. No text, letters, numbers, labels, watermark, signature, modern objects, photography, realistic 3D, cinematic lighting, gore, or readable manuscripts.

### C02 · 陶顿，1461

文件：`assets/art/02-towton.jpg` · 4:3

**提示词**

Create one horizontal illustration, 4:3, in the exact unified manner of a flat late medieval religious panel on old parchment. The Battle of Towton, Palm Sunday 1461: a broad nearly empty snow-covered Yorkshire field, a low dark line of leafless trees, a pale small sun enclosed by an old-gold ring. In the foreground three feathered arrows lean in the wind and disappear into snow; a burgundy banner and an ivory banner occupy opposing edges, their cloth bent in the same cold direction. Distant soldiers are only a few simple geometric silhouettes in historically appropriate fifteenth-century English armor. Snow and silence dominate, making the cost of a new king perceptible without spectacle. A very restrained trace of dark red pigment beneath the snow, no bodies or graphic wounds. Hieratic frontal composition, sparse forms, charcoal-brown outlines, matte tempera flat colors, rubbed parchment grain and restrained age cracks. Burgundy #722D35, parchment #E7DCC2, umber #302A25, old gold #A58A56, desaturated gray-green only in the horizon. Uncanny storybook stillness, medieval devotional art, authentic 1461 clothing and weapons. 8% safe margins. No text, letters, numbers, caption, signature, watermark, UI, modern objects, realistic 3D, photographic snow, cinematic lens or gore.

### C03 · 巴内特，1471

文件：`assets/art/03-barnet.jpg` · 4:3

**提示词**

Create one horizontal historical panel, 4:3, a flat medieval devotional painting rendered in matte tempera on worn parchment. Barnet, Easter morning 1471: two groups of tiny armored silhouettes stand separated by broad flat bands of pale mist. Above them hang two heraldic cloth shapes whose light-colored devices look confusingly similar at a distance, one radiating sun and one star-like device, not exact documentary flags. In the foreground a single ceremonial staff is broken in two across gray-green grass; its old-gold finial faces a small discarded crown token. The scene expresses a mistaken recognition, shifting allegiance, and the fall of a kingmaker. Mist must be opaque graphic bands, not volumetric or cinematic. Deliberately limited perspective, almost symmetrical religious-panel arrangement, simplified human faces if any, thin umber contours, chalky ivory, dark burgundy #722D35, parchment #E7DCC2, dark umber #302A25, weathered gold #A58A56. Fine dry pigment texture and barely visible cracks. Historically appropriate English armor and weapons of 1471. Restrained eerie narrative without copied game imagery. All important objects within 8% margins. No writing, letters, numbers, captions, logos, watermarks, signature, photographs, realistic 3D, modern clothing, fantasy armor or gore.

### C04 · 伦敦塔，1483

文件：`assets/art/04-tower.jpg` · 4:3

**提示词**

Create one horizontal illustration, 4:3, as a spare and enigmatic late medieval religious panel on parchment. An interior chamber in the Tower of London in 1483, frontal Gothic stone architecture, two tall narrow arched windows, two small empty wooden chairs beneath them. A closed ivory curtain partly covers one arch. On a central stone ledge rests a closed burgundy letter with an unlettered wax seal; a small old-gold key lies separately. No children are depicted, no assassin, no violence, no determined answer: the image must leave the fate of the Princes in the Tower unresolved. Use empty space and paired objects to convey absence. Flat simplified stone blocks, fine dark-brown outlines, shallow icon-like space, matte tempera surfaces, soft worn parchment grain, subtle age cracks. Burgundy #722D35, parchment ivory #E7DCC2, umber #302A25, sparse old gold #A58A56. Restrained uncanny atmosphere, late fifteenth-century English objects and architecture, no theatrical horror. Keep key objects inside an 8% safe margin. No text, letters, numbers, inscriptions, watermark, signature, UI, modern objects, realistic 3D, cinematic volumetric light, photorealism or gore.

### C05 · 博斯沃思，1485

文件：`assets/art/05-bosworth.jpg` · 4:3

**提示词**

Create one horizontal illustration, 4:3, in flat medieval devotional-panel style with restrained uncanny storybook simplicity. An emblematic aftermath of Bosworth Field, 1485: an old-gold crown lies low among stylized hawthorn branches in the foreground, treated explicitly as a symbolic visual tradition rather than documentary reconstruction. A fallen small ivory boar banner crosses one side; on the far low horizon a narrow deep burgundy standard rises beside a few tiny soldiers. No dead king, no triumphant hero portrait, no battle spectacle. The thorn, crown, fallen boar, and distant standard tell of the end of Richard III's reign and Henry Tudor's accession. Strong quiet geometry, flat low-saturation shapes, fine umber contour lines, matte tempera pigment on aged parchment, very subtle surface cracks. Colors burgundy #722D35, parchment #E7DCC2, dark umber #302A25, old gold #A58A56, desaturated gray-green hawthorn. Authentic English heraldic vocabulary and late-fifteenth-century equipment. 8% crop-safe margins. No readable text, letters, numbers, captions, labels, signature, watermark, modern objects, photorealism, realistic 3D, cinematic lighting or graphic violence.

### C06 · 联姻，1486

文件：`assets/art/06-union.jpg` · 4:3

**提示词**

Create one horizontal allegorical historical illustration, 4:3, like a restrained fifteenth-century English religious panel painted in flat tempera on old parchment. The marriage of Henry VII and Elizabeth of York, 1486, represented by only two hands entering from opposite edges, one in a deep burgundy late medieval sleeve and one in a warm ivory embroidered sleeve, gently binding a red rose branch and a white rose branch with a thin old-gold thread. Above their joined stems blooms one small double red-and-white Tudor rose, an emblem of the new dynasty. A simple Gothic chapel arch frames the gesture; several withered red and ivory petals lie below, preserving the memory of earlier losses. No full wedding party and no sentimental modern romance. Balanced devotional composition, spare dark-brown outlines, shallow flat space, elegant restrained shapes, parchment grain and slight rubbed pigment. Burgundy #722D35, ivory #E7DCC2, dark umber #302A25, old gold #A58A56, muted gray-green stems. Historically appropriate 1486 sleeves and architecture. Keep hands and flower within 8% margins. No text, lettering, numbers, inscription, watermark, signature, UI, modern objects, photographic realism, realistic 3D, cinematic lighting or ornate baroque decoration.

### C07 · 斯托克，1487

文件：`assets/art/07-stoke.jpg` · 4:3

**提示词**

Create one horizontal historical illustration, 4:3, in the same flat late medieval religious-panel language on aged parchment. After the Battle of Stoke Field, 1487: a quiet gray-green English field, a broken standard lowered among reeds, and a small unadorned wooden crown placed on a plain stool in the foreground, symbolizing a pretender's claim rather than a verified historical artifact. Far away a walled town sits beneath a thin muted old-gold dawn. A tiny red-and-white rose grows beside a cut branch; it suggests a dynasty surviving another challenge, not a permanent or total end to conflict. Sparse, balanced, solemn composition with ample parchment sky, thin charcoal-umber outlines, matte flat tempera colors, slight pigment wear and hairline cracks. Deep burgundy #722D35, parchment #E7DCC2, umber #302A25, old gold #A58A56, restrained gray-green. Late fifteenth-century English objects, no later military equipment. An eerie but thoughtful final image, no copied game scene. Key objects inside 8% crop-safe margins. No text, numbers, letters, captions, logos, watermarks, signature, modern objects, photorealism, realistic 3D, cinematic depth of field or gore.

## 人物肖像 · 6 幅

每幅为半身像，脸部形状清楚而克制，人物目光与观者有轻微距离。背景统一为羊皮色浅拱龛，避免六张人物成为不同年代或不同画风。不要在脸上添加游戏式夸张表情。

### P01 · 安茹的玛格丽特

文件：`assets/art/margaret.jpg` · 3:4

**提示词**

Create a vertical 3:4 half-length symbolic portrait of Margaret of Anjou, queen consort of Henry VI, imagined around 1455, approximately 25 years old. A determined young woman in a historically appropriate mid-fifteenth-century burgundy English-French court gown, a restrained structured headdress and linen veil, no Tudor ruff and no later gable hood. Her hands protect a small royal wax seal on a closed unlettered parchment; a modest dark red rose appears as a narrative emblem, not a claim of universal historical uniform. Upright devotional-panel posture, quiet watchful face, almond-like simplified eyes, contained tension, no fantasy villain expression. Shallow parchment-colored Gothic niche, thin old-gold arch, flat tempera color planes with fine umber outlines, subtly worn pigment. Palette burgundy #722D35, parchment #E7DCC2, umber #302A25, old gold #A58A56. Unified flat medieval religious painting, restrained uncanny storybook elegance, historical interpretation rather than a verified likeness. 8% crop-safe margins around head and hands. No text, letters, numbers, signature, watermark, modern clothing, baroque crown, cinematic light, realistic 3D, photorealism or detailed blood.

### P02 · 沃里克伯爵

文件：`assets/art/warwick.jpg` · 3:4

**提示词**

Create a vertical 3:4 half-length symbolic portrait of Richard Neville, Earl of Warwick, the Kingmaker, imagined around 1469 at approximately 40 years old. A composed English nobleman with a narrow serious face, straight dark hair of a historically plausible fifteenth-century length, wearing a muted charcoal-brown wool doublet, burgundy cloak and a small restrained gold chain. His open hands hover between two tiny old-gold crown tokens on a narrow ledge, suggesting political calculation and changing allegiance. A small simplified ragged-staff motif may appear on the cloak clasp; no readable heraldic motto. Frontal icon-like posture, simplified quiet eyes, neither caricature nor fantasy sorcerer. Parchment Gothic niche with a thin gold arch, flat matte tempera, precise umber contours, sparse pigment wear and fine age cracks. Burgundy #722D35, parchment #E7DCC2, umber #302A25, old gold #A58A56. Consistent flat medieval devotional portrait, restrained uncanny atmosphere, historically interpreted rather than verified likeness. Keep head and hands inside 8% margins. No letters, text, numbers, watermark, signature, modern suits, Elizabethan ruffs, ornate fantasy armor, photorealism, realistic 3D or cinematic lighting.

### P03 · 爱德华四世

文件：`assets/art/edward.jpg` · 3:4

**提示词**

Create a vertical 3:4 half-length symbolic portrait of Edward IV of England around his accession in 1461, a tall-looking young man approximately 19 years old, broad shoulders and a composed, alert face. Wear authentic early-1460s English court clothing: a deep burgundy velvet doublet, a restrained dark cloak, a narrow old-gold crown, no later Tudor ruff. One hand holds a small ivory-white rose; behind his head place a simple radiant sun emblem inside the architectural background, clearly a heraldic device and not a claim of sainthood. Quiet authority with a trace of youth, flat stylized eyes and hands, no modern model styling. Half-length frontal medieval devotional-panel composition in a shallow parchment Gothic niche, thin umber outlines, low-saturation flat tempera color fields, old-gold accents, worn parchment grain and subtle pigment cracks. Palette #722D35, #E7DCC2, #302A25, #A58A56. Restrained uncanny storybook mood, historical interpretation rather than a verified likeness. 8% safe margins. No text, letters, numbers, labels, watermark, signature, modern clothes, fantasy armor, photorealistic skin, realistic 3D, cinematic lighting or copied game characters.

### P04 · 玛格丽特·博福特

文件：`assets/art/beaufort.jpg` · 3:4

**提示词**

Create a vertical 3:4 half-length symbolic portrait of Margaret Beaufort around 1485, approximately 42 years old, a mature English noblewoman with a slender attentive face and controlled, thoughtful expression. She wears a historically plausible late-fifteenth-century dark gown and close black headdress with a plain ivory linen edge, influenced by her surviving devotional portrait tradition but not copied. Her left hand rests on a small closed prayer book with an unlettered burgundy cover; her right hand holds a folded sealed letter, with a tiny old-gold key beside it, symbols of faith, networks and careful planning. No halo, no royal crown, no caricature of old age. Quiet frontal religious-panel arrangement in a shallow parchment Gothic niche, thin old-gold arch, flat matte tempera planes, fine umber outlines, slight rubbed pigment and delicate age cracks. Palette dark umber #302A25, burgundy #722D35, parchment #E7DCC2, sparse gold #A58A56. Unified restrained uncanny medieval storybook style, interpreted historical likeness. Keep face and hands within 8% crop-safe margins. No readable book text, letters, numbers, inscriptions, watermark, signature, modern dress, realistic 3D, photography, cinematic light or ornate baroque decoration.

### P05 · 理查三世

文件：`assets/art/richard.jpg` · 3:4

**提示词**

Create a vertical 3:4 half-length symbolic portrait of Richard III of England around 1483, approximately 30 years old. A narrow-faced young adult with straight dark shoulder-length hair and a serious, reserved expression, wearing a late-fifteenth-century burgundy court gown with a dark collar and a small white boar badge. His fingers lightly turn a plain old-gold ring; a narrow crown sits on a ledge nearby, not theatrically on his head. His posture should be natural and dignified; do not use exaggerated deformity, a hunched villain stereotype, a sinister grin, or any suggestion of a solved accusation about the Princes in the Tower. Frontal half-length devotional-panel arrangement inside a shallow parchment Gothic niche, simplified almond-shaped eyes, flat matte tempera fields, thin umber linework, subtle parchment grain and pigment wear. Palette burgundy #722D35, parchment #E7DCC2, dark umber #302A25, old gold #A58A56. Restrained uncanny historical storytelling, interpreted likeness rather than a verified portrait. Keep head and hands within 8% margins. No text, lettering, numbers, watermark, signature, modern clothing, later Tudor ruff, fantasy armor, photorealism, realistic 3D or cinematic lighting.

### P06 · 约克的伊丽莎白

文件：`assets/art/elizabeth.jpg` · 3:4

**提示词**

Create a vertical 3:4 half-length symbolic portrait of Elizabeth of York around her marriage in 1486, approximately 19 years old. A young English woman with a long oval face, quiet direct composure and softly visible fair hair beneath a historically appropriate late-fifteenth-century structured veil and modest headdress. She wears an ivory gown with a deep burgundy outer garment and sparse old-gold embroidery, no later Tudor ruff or enormous skirt structure. Her hands hold one stem bearing a small red-and-white double Tudor rose, the new dynastic emblem, while one loose ivory petal rests near her wrist. Express a survivor's memory and measured hope, not a decorative princess or modern romantic pose. Frontal medieval devotional half-portrait in a shallow parchment Gothic niche, thin gold arch, flat tempera colors, refined dark-umber outlines, gentle rubbed pigment and tiny age cracks. Palette #722D35, #E7DCC2, #302A25, #A58A56. Unified restrained uncanny storybook style, historical interpretation rather than a verified likeness. Head and hands stay inside 8% safe margins. No text, letters, numbers, watermark, signature, modern makeup, fantasy jewelry, realistic 3D, photography or cinematic lighting.

## 接入和检查

1. 在用户确认继续制作插画后，使用可用的图像生成模型逐张生成；此文档本身不构成已调用模型的记录。
2. 先以 C06 和 P04 确认同一画风，再生成其余作品。保持固定色板、轮廓粗细、人物比例和肌理强度。
3. 按清单文件名保存至 `assets/art/`。生成原图或中间版本也留在用户指定工作区内，不覆盖经确认的成品。
4. 检查历史衣冠、手指、肖像年龄、是否有文字伪影、是否引入未证实的历史结论，以及书页裁切后的构图。不要只在独立图片里验收。
5. 在 `assets/art.js` 注册已验收图片，例如 `window.BOOK_ART.chapters['01-st-albans'] = 'assets/art/01-st-albans.jpg'`，人物则使用 `window.BOOK_ART.characters.margaret = 'assets/art/margaret.jpg'`。实际入口为 `window.BOOK_ART = { chapters: {}, characters: {} }`，随离线网页加载；`assets/art-manifest.json` 是制作清单，运行时不会自动读取它。
   - `assets/art-frames.js` 读取 `BOOK_ART.chapters`，人物阅读页、全景、卷首与尾声均使用相同画位入口。图片加载失败时 `app.js` 会移除损坏图片，退回空画位，不恢复自绘叙事画。
   - `app.js` 的 `media()` 读取 `BOOK_ART.characters`，人物图片覆盖选择页 `.portrait-reserve` 中的空画位。图版目前适配紧凑书页尺寸；正式图片接入时须重新检查裁切、图注与无障碍描述。
6. 逐张确认成品存在且可读后，再把清单中相应 `available` 改为 `true`；全部完成后把顶层 `status` 改为 `complete`。保留精确的模型、提示词和生成时间记录。

## 原创 SVG 与游戏素材接口

以下是归档接口，第三版不加载它：`window.ChronicleArt.scene(index, className = '')` 返回一幅 `viewBox="0 0 600 560"` 的 SVG 叙事画，索引按上表为 0—6。若用户未重新要求，不要将此文件加回网页入口。当前正式画位入口为 `window.ArtFrames.render(index, label)`。

`window.RoleGames.render(roleId, chapterIndex, state, { solved })` 将各人物游戏状态渲染为完整游戏区域，图形与可操作按钮一起生成，勿用静态图替换仍需交互的棋盘、织锦或密信。游戏 SVG 装饰自身使用 `aria-hidden`；按钮与游戏区域另有文字标签。人物图形身份与操作说明见 `window.RoleGames.meta(roleId)`；游戏不是史实地图、真实兵力或人物行为的模拟。

## 封面与纹章接口

`window.Ornaments.icon(name, className = '')` 返回 `viewBox="0 0 48 48"` 的 SVG 字符串。可用名字：`rose`、`lily`、`crown`、`sun`、`key`、`boar`、`feather`、`arrowLeft`、`arrowRight`、`close`、`sound`、`muted`、`expand`、`bookmark`、`seal`。

`window.Ornaments.rose(className = '')` 返回 `viewBox="0 0 320 360"` 的竖版植物纹章。轮廓继承 `currentColor`；色面可由 `--ornament-red` 与 `--ornament-white` 覆盖。花茎为 `.rose-stem`，花苞为 `.rose-bud`，红白花瓣为 `.rose-petals-red` / `.rose-petals-white`，花心为 `.rose-heart`，落瓣为 `.rose-falling-petal` / `.rose-falling-petal-white`。花苞与落瓣初始透明，CSS 可用于开花与凋谢过场；静态封面默认呈现完整盛开的双层玫瑰。所有图标均 `aria-hidden`，交互按钮应由调用方提供文字标签。
