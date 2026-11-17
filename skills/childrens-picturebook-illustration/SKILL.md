---
name: childrens-picturebook-illustration
description: Create and revise warm cartoon children's picture-book illustrations with immersive habitats, scene-appropriate outfits, concise Chinese text, consistent bird species, and chapter-based file organization.
---

# Children's Picture-Book Illustration

Create illustrations that help a child follow, feel, and remember a story. Prioritize a clear emotional beat, readable action, warmth, and continuity over visual novelty.

## 图片生产规则与适用范围

- 用户最新指示、已确认图稿与当前项目的交付规范优先于通用模板、旧提示词和历史脚本。已确认样式与范围继续沿用，不重复征询确认。
- **最新规则：后续由用户在自己电脑上进行超分。Agent不再执行CPU或GPU超分，也不为提高场景分辨率做插值放大；新图直接保留生成时的原始像素尺寸。本仓库只交付正式原尺寸素材，不附超分工具或旧超分产物。**
- 进行图页生成、去字、分层或交付时，读取本Skill的[图片生产与验收规范](references/image-production.md)。规范覆盖原尺寸源图保存、透明PNG、局部修字、阅读PDF及验收。
- 雨林、鸟类与草原使用无字场景＋透明文字素材的分层PNG流程。项目文件以[仓库目录](../../README.md)及[通用制图约束](../../制图规范/通用制图约束规范.md)为准；鸟类已按新剧本完成40页，当前文件及尺寸以素材索引为准；草原已完成P6与P31两张正式无字图，其余页面及文字分层尚未制作。

## Scope and defaults

- Intended readers: ages 3–8 unless the request specifies otherwise.
- Default format: 1:1 square single-page artwork, including covers and chapter openers. Only use a landscape spread when explicitly requested; for spreads keep key objects away from the gutter.
- Default visual direction: child-friendly cartoon illustration with rounded, expressive shapes, clear silhouettes, playful but restrained proportions, and watercolor-and-colored-pencil texture. Use soft natural light and avoid photorealism. Match a supplied reference or requested medium instead.
- Default palette: warm and inviting—sunlit cream, honey yellow, peach, coral, terracotta, warm leaf green, and muted sky blue—with one or two gentle cool accents for balance. Favor soft midtones, warm highlights, and comfortable contrast over neon colors, muddy grays, or a harsh dark mood.
- Preserve a calm, hopeful tone. Tension may be present, but its visual treatment must remain age-appropriate and emotionally containable.
- Warmth does not mean every page is golden sunset: use habitat-appropriate greens, blues, earth tones, moonlight, snow and indoor light while preserving a friendly, cohesive mood.
- Never add lettering, captions, logos, watermarks, or pseudo-text unless the user explicitly requests it. For a composed page, plan quiet space for the approved text. For a separate text-free scene, restore a complete natural environment without artificial typography blanks or label-shaped patches.

## Start with an illustration brief

Before generating, derive or request the smallest useful brief:

1. **Story beat:** What changes in this moment? State it in one sentence.
2. **Emotion:** Name the main feeling and a secondary feeling (for example, curious but cautious).
3. **Characters:** Record each recurring character's species/age, silhouette, proportions, face, clothing, colors, and distinctive props.
4. **Setting and time:** Identify location, season, time of day, weather, and cultural or historical details that must be accurate.
5. **Page role:** Choose establishing, discovery, action, quiet pause, transition, or closing image.
6. **Text placement:** Identify the page/area that needs quiet negative space. Keep important visual information out of that area.
7. **Production constraints:** Note orientation, trim/bleed, spread versus single page, color limits, and whether artwork must work in print.

If essential facts are absent, make a short, explicit assumption rather than inventing a complex backstory. Ask a clarifying question only when a choice would materially alter the artwork, such as the protagonist, target age, visual style, or page format.

## Design the image before prompting

Use this sequence:

1. **Choose the visual sentence.** Identify who is doing what, where, and why the child should look.
2. **Set hierarchy.** Make one focal point unambiguous; support it with gesture, contrast, framing, and leading shapes. Limit competing focal points.
3. **Make action legible.** Favor readable poses and silhouettes. Show cause and effect with props, expressions, tracks, motion cues, or reactions.
4. **Build depth simply.** Use foreground/middle-ground/background layers without crowding the scene. Let background detail reward a second look, never obscure the plot.
5. **Plan the delivery layers.** For composed pages, use a quiet physical sky, wall, snowbank or grass area for text. For separate text-free artwork, complete the habitat and put readability backgrounds on the independent lettering PNGs.
6. **Check the spread.** Keep focal action away from the center gutter; balance the two pages without making them mirror each other.

## Character continuity

For a sequence, create and maintain a character bible before generating page art. Include:

- a concise visual anchor (for example, “small russet fox, oversized teal raincoat, one cream ear tip, round amber satchel”);
- height and proportion relative to companions and objects;
- palette names or approximate colors for clothing and signature items;
- facial features and expression range;
- recurring locations and their fixed landmarks;
- explicit exclusions: no changed facial identity or eye color, no altered limb count, no age shift, no missing signature prop unless the plot calls for it. Clothing is scene-dependent: document outfit changes instead of treating one costume as permanent.

Repeat only the most important anchors in every image prompt. For revisions, say what must stay unchanged before describing the requested change.

## Active project constraints: 《羽毛图书馆：会飞的鸟类大百科》

Apply these constraints to this project. The user's latest confirmed correction takes precedence over older scripts, prompts and reference-image details. Use the [formal bird manuscript](../../鸟类绘本/正式制图剧本.md), [bird constraints](../../鸟类绘本/制图约束规范.md), and page-specific approved revisions as the current source.

- **Book format:** 40-page picture book for ages 4–8 and shared parent-child reading. All pages, front/back covers and chapter openers use 1:1 square canvases. Chapter ranges are P3–P12 (habitats), P13–P20 (birdsong), P21–P29 (body skills) and P30–P36 (daily life and the return journey); P1–P2 are opening material and P37–P40 are closing material. Use the [chapter comparison](../../鸟类绘本/章节重排与前后对照.md) to match older references by page title before applying the new numbers.
- **Xiaoman / 小满:** a five-year-old girl with short hair and a small cloth backpack containing a notebook and colored pencils. Lock her age, face, haircut, bag and its contents across pages. Clothing and footwear MUST adapt to habitat, weather and activity: canvas/sports shoes on dry grassland, sturdy walking shoes and trousers in scrub, rain boots at streams or on muddy ground, warm clothing in cold environments, and light comfortable clothing indoors. Hats are used for sun, cold or rain as needed. Yellow rain boots are a wet-environment option, not a fixed character identifier.
- **Yuyu / 羽羽:** a hoopoe bird book sprite with golden-brown feathers. Its crest rises or relaxes to express emotion; its tail feathers resemble a bookmark. Preserve these two magical identifiers, while retaining a recognizably bird-like body and clear, child-friendly expressions. Retain the approved small rust-red book pendant on a thin neck cord, with a gold border and feather emblem. Let its position and partial occlusion follow the pose; do not silently omit it or substitute it for the bookmark tail.
- **Yuyu / 羽羽 — visual model lock:** Yuyu is always a hoopoe, never a cockatiel/parrot. It has a warm buff-to-golden-brown body, a long slender slightly down-curved black bill, broad black-and-cream zebra-barred wings, and a fan-shaped cinnamon crest with distinct black tips. The crest may open or relax with emotion; the long tail ends in a bookmark-like ribbon/feather. Keep these identifiers in every appearance. **Never give Yuyu a cockatiel's round yellow face, orange cheek patches, short hooked parrot beak, or smooth all-yellow crest.**
- **Cuckoo clue / 布谷鸟声音线索 — visual model lock:** The cuckoo is separate from Yuyu. The confirmed species features are: smooth uncrested slate-gray head and breast, dark gray-brown folded wings, pale belly with fine dark horizontal bars, yellow eye ring, slender straight bill, long dark tail with pale spots. When singing visibly, BOTH feet grip a branch, the body sits side-on roughly horizontally, the beak opens and the head lifts slightly. It does not cling vertically to a trunk like a woodpecker. Simplify into a cute cartoon without losing these identifiers. On pages needing only a hint, use two small golden note icons, sound rings or a distant silhouette. Keep it secondary unless the story centers on it.
- **Knowledge label / 鸟类小百科:** story pages and chapter openers use a compact cream hand-journal fact sticker in a corner. Keep its exact fact text readable and outside faces, focal actions and story text. Covers, dedication and ending pages follow their specific manuscript roles (such as a feather-bookmark search prompt or parent-child task), rather than forcing a fact sticker onto every page.
- **Species and pronunciation proofing:** review prose readability before drawing lettering, then inspect actual PNG glyphs, simplified bird radicals, tone marks and neutral tones. Follow the [bird name/pronunciation table](../../鸟类绘本/制图约束规范.md): 雌鸟 is cī niǎo, 亲戚 is qīn qi; 嗓 and 噪 are different characters. P16 compares 斑胸噪鹛、橙翅噪鹛 and the Mexican Clarion Wren (号声鹪鹩, Troglodytes tanneri), linked by magic book pages rather than claiming a shared natural habitat. Match their chest/wing/eyebrow features to the formal manuscript; do not reuse the old white-bibbed birds or substitute Musician Wren.

## Active project constraints: 《非洲草原大冒险》

Use the [formal savanna manuscript](../../非洲草原绘本/制图剧本.md), [savanna constraints](../../非洲草原绘本/制图约束规范.md), the shared character sheets and the user's latest corrections as the source of truth.

- **Travel versus observation:** the magic book carries Xiaoman only on designated travel pages such as P3, P13, P22 and P30. At an animal observation point, Xiaoman steps onto safe ground or enters the fixed observation hut; the book shrinks, closes or rests nearby. Do not keep her standing on the book while observing wildlife, and do not add a daytime protection dome.
- **Night protection and overhead perspective:** on P31—P35 the magic book may freely change size, fly above the camp lounge and hover nearly horizontal in an inverted open state, with inner pages facing downward toward Xiaoman and Yuyu. A child-height upward camera sees strongly foreshortened downward-facing pages, not a front-facing book logo. Page illustrations must rotate, shorten and curve with each page plane; the green covers sit behind the page blocks. If pages turn while the book is inverted, they must lift from the downward-facing inner surface, bow downward toward the characters beneath the book and return to the opposite inner surface; never let turning pages pass above or through the green covers. Cast the soft semi-transparent golden-green dome from the downward-facing gutter and page edges, and contain the light inside so it does not shine through the screen window or disturb wildlife.
- **Symmetric open-book lock:** whenever the book is open, its left and right page blocks must be equal in width, thickness and opening angle, with a centered readable gutter, matching layered page edges and continuous thin green covers. Reject a one-wing shape, mismatched halves, twisted spine or one side larger than the other.
- **Gaze and body axis:** lock the actual observation target before drawing. Align feet or seated support, pelvis, chest, shoulders, neck, chin and both pupils toward that target as the pose requires; do not rotate only the eyes or head. Check the full composition and an enlarged face crop.
- **Hands and fixed props:** inspect each hand enlarged for four fingers plus one thumb, plausible occlusion, correct palm/wrist connection and believable contact. Lock one cross-page model for true recurring props: the green magic book and leaf bookmark, tan backpack, notebook, colored pencils and binoculars; only perspective and distance may change their apparent size. If a project uses the confirmed recorder, it is also a fixed prop and must retain the same body, furry windscreen, controls and hand-to-device scale. Clothing, hats, outerwear and footwear may change with habitat, weather and activity; require continuity only within the same uninterrupted scene or outfit sequence.
- **No-text production:** produce 1:1 text-free 1254px scene PNGs with continuous habitat to all edges and about 12%—15% natural composition margin. Titles, story text and savanna fact stickers remain separate transparent layers; do not leave artificial white typography holes in the scene.

## 画面叙事：小满亲历场景

- 小满应真正进入鸟类所在的环境，通过走、停、听、跨树根、扶栏、记录、侧身寻找等动作推进探索。人物的动作与视线要有明确对象，眼睛应看向正在观察的鸟或记录内容。
- 每页先锁定一个具体观察目标，再按实际图中的左右、高低和距离同时调整头颈、下巴仰俯角及双眼瞳孔；不能用通用仰头笑脸代替观察，也不能只挪眼珠而让脸仍朝着空白处。目标是鸟时，核对是否误看羽羽、录音机、天空或另一只鸟；设备挡住视野时，在当前授权范围内自然降低持物手。全图与面部放大图都要看，成品不画视线箭头。
- 鸟类P3采用书中延伸到书外的音符与光线道路，小满以有体积的人物站在宽光路上，鞋底有接触关系，不再成为纸面地图里的小人。金蓝音符在此页是魔法转场，区别于真实鸟鸣声源；P1仍保持小满站在展开内页上的封面结构。
- 默认采用有亲历感的儿童高度中景，兼顾人物表情与环境。不要把小满缩成远处的小点，也不要把她固定放在画面边角、让鸟类排成展示队列。
- 用前景遮挡、中景行动、远景栖息地，以及道路、水流、树枝的走向建立透视。需要拉开人与鸟距离时，可让鸟停在另一棵远树上；不要仅靠极端拉远镜头来表达高度。
- 不同页面改变人物位置、动作、朝向、镜头角度和空间层次，避免反复使用同一蹲姿、同一条栈道、同一片金色芦苇或同一夕阳。
- 真实探索页使用连续的实地环境，不默认使用巨书托起场景、分框拼贴、标本式陈列或第三方讲解舞台。封面与明确需要魔法的转场可按脚本使用书本元素；图书馆整理页则表现实际桌面、书架和活动。
- 正文保留简短动作、感受或直接对话，让画面承担细节；不要为每只鸟追加旁白说明。鸟类知识放在百科贴纸中。

## 栖息地多样性与服饰适配

**优先根据鸟类活动选择环境，不为制造变化强行轮换四季。** 草原、田边、森林、灌丛、溪流、湿地、开阔湖岸、城市和室内都可以构成差异；仅在鸟类习性与情节适合时使用冰川、雪地或明显季节变化。

| 环境与活动 | 衣着、鞋帽选择 |
| --- | --- |
| 干燥开阔草地、晴天郊游 | 轻便上衣、合适长短裤、帆布鞋或运动鞋；需要时戴遮阳帽 |
| 干燥田边、石路 | 合适长袖或马甲、长裤、稳固徒步鞋；不默认穿雨靴 |
| 浓密或带刺灌丛、林下探索 | 长袖长裤、包脚步行鞋，避免裸露腿部钻刺丛 |
| 溪流、浅水、湿地泥地 | 防水雨靴和适当衣物；湿地干燥栈道可按实际情况选鞋，不一概强制雨靴 |
| 开阔湖岸、日照较强的干地 | 轻便衣物、运动鞋或徒步鞋、遮阳帽；鞋是否防水取决于站立地面 |
| 寒冷、雪地或极地 | 保暖外套、帽子、围巾及合适保暖防水鞋靴 |
| 室内整理、画画 | 轻便上衣、开衫或舒适衣裤，室内鞋或适合室内的便鞋；帽子外套可收好 |

- 小满保持5岁、脸型、短发与布包等身份特征，换衣换帽不改变人物身份。服装色彩可以变化，不固定黄色外套和黄色雨靴。
- 各页同时检查植被、地面干湿、气温、光照、服装厚度和鞋底用途是否相符。不要把不适合该环境的鸟搬到雪地或草原，只为增加视觉变化。
- 章节生成前列出各页的“栖息地／活动／镜头／衣服／鞋帽／光线”简表，检查相邻页是否过度相似。

## 精简正文与版式层级

- 正文目标为每页约20—40个汉字、2—3行，只保留一个主要动作或情绪；允许章扉、高潮和封面按必要性调整。知识细节由百科小贴士承担，不挤进正文。
- 普通内页的图内标题只保留文字，例如 `湿地里的三位邻居`，不印页码、`P19`、`19｜` 或其他页码分隔符，避免与不展示页码的非正文页形成断号。标题字高约为正文字高的115%，即比正文大一点点；不能小于正文，也不恢复为占满顶部的巨大标题。默认使用柔和古金色，正文用清晰暖深棕色，留足行距和页边距。
- 章扉使用“第几章＋章名”的独立层级，可适当放大。封面另用主书名层级；文件名中的 `P` 不自动变成印在画面中的页标题。
- 先安排人物和行动，再利用安静的天空、墙面或其他低细节区排字；必要时加轻薄米白底。不得为大段文字牺牲主画面，也不得让文字盖住脸、鸟或关键道具。
- 用户要带字图时，提示词中提供标题、正文、贴士的逐字内容和建议断行，检查漏字、重字、错字与标点。不得因默认“避免生成文字”规则而交付空白正文；用户要无字底图时才预留空白。
- 分区排版，避免将百科标题加到封底正文上。检查正文与画面是否一致，例如已删除啄木鸟的页面不再沿用啄木鸟故事文案。
- 笔记本内容也要叙事清楚：用几组可辨识的鸟形贴纸配长线、小点、彩色弧线；布谷鸟线索配两枚金色音符。录音机的真实波形和儿童自创记录符号分开表达。
- **逐页科普台词：** 用户要求四章及章内各页都设计小满与羽羽的科普对话，当前覆盖P3—P36，每页小满一次发言、羽羽一次回应，不再每章只写一组概述。对话必须落到具体鸟类、现象或结构上；羽羽解释机制、用途或区别，保留物种与个体差异等边界，不以“还有什么秘密”等泛问和知识罗列代替科普。本仓库未收录独立问答台词稿；如需新增，依据当前正式剧本逐页核对并记录来源，未经排版修订不直接把长回答塞进贴纸，也不自动替换正式剧本。
- **画面先于问题：** 用户进一步指出不能为讲知识而反推小满的问题。逐页先核对她此刻看见、听见、正在做什么，再用5岁孩子自然的口吻表达；不让她预知未介绍的术语、性别、祖先等结论，不捏造看不见的动作或心理。P7只有枝头布谷鸟鸣叫，不能突然问宝宝住哪里；P4不凭空引入蝙蝠，P19脚被水遮挡时不先讨论脚蹼，P34不先替松鸦安排种树意图。知识可以由羽羽在回应中适度延伸，但必须承接眼前的发现或疑问；每页的画面触发点另列供编辑核对，不作为角色台词朗读。
- **句式与语气随现场变化：** 小满可以惊呼、陈述发现、猜测、比较、试探或直接追问，不强制每句以问号收尾。羽羽自然接着解释；不能通篇用“啦？呀？”结尾，也不能机械轮换“呢、吗、吧”代替句式变化。燕子页可以问“它们的泥窝怎么能粘在屋檐下面不掉下来呢？”，鹌鹑页也可以惊呼“快看，那个‘土块’动起来了！”；这些是独立问答的语气示例，不自动替换正式剧本。保留孩子的现场感和具体的科学解释。

## 人体比例、手指与接触关系（重点验收）

- 用户指定身体转向时，同步调整肩线、胸廓、腰胯与必要的步态，不能只转头而保留相反朝向的躯干。手的位置先按画面左右明确，再检查其属于哪侧肩；拢耳手从同侧肩自然抬到头侧，不跨胸伸向对侧耳，也不误画成托腮或遮阳。鸟类P18身体偏向画面左侧，头边手也在画面左侧，另一手握确认款录音机。
- **小满每只手的结构必须是四根手指加一根拇指，共五指。** 儿童卡通风格可以简化线条，但不能把人手简化成四指卡通手、连指手套或没有结构的肉团；不得出现多指、少指、融合、分叉、漂浮手指或重复手掌。
- **五指结构不等于任何角度都必须看见五个指尖。** 侧面、握持、弯曲或遮挡可以使部分手指不可见，但可见轮廓、拇指位置和遮挡顺序必须合理。不得为了数齐五指而强行摊手、画成爪形，或把被遮挡的指头补到手背、手腕及错误一侧。
- 手掌、手腕和前臂应连贯，左右手的拇指方向随朝向正确；掌背不能混淆，手腕不得异常扭折。手的大小符合5岁儿童比例，不用成人大手，也不画细长尖爪。
- **托脸／捧脸：** 掌根或掌面真实承托下颌或脸颊，弯曲的手指顺着脸侧排列；拇指位于合理的掌侧。手指不能穿入脸部、与头发融合，也不能把双手拼成一只无法辨认的手。
- **扶膝／扶栏：** 手掌顺着膝盖或栏杆表面接触，四指与拇指的走向、弯曲和受力关系自然。不得只画四根向下的手指而遗漏本应可见的侧拇指，也不得画悬空贴在物体上的手。
- **捧书／画画／持物：** 先明确哪只手支撑、哪只手翻页或握笔，再画手指包握与物体边缘的前后关系。书、笔、栏杆不得穿过手掌；物体遮挡的手指不额外补出，手指也不得与书页或笔杆融为一体。
- 身体保持5岁儿童的头身、躯干与四肢比例。检查肩、肘、腕、髋、膝、踝的连接和重心；站姿脚底落地，坐姿臀部有真实支撑，身体不得穿过椅子、桌子或栏杆。不要靠拉长上半身迁就家具；需要改为站姿等动作变化时，遵循用户确认的修订范围。
- 修手优先保持原动作、表情、服饰、道具和构图，只调整必要的掌指与接触区域。若原姿势无法合理成立，再提出或在用户授权范围内改用更自然的动作，不顺带重画整页。
- **双侧楼梯护栏：** 先区分近侧和远侧扶手，再检查人物所扶的是哪一侧。扶手经过身体、背包遮挡后仍需沿同一条楼梯边缘连续出现；近侧护栏按透视遮挡人物，不能为露出全身移到其身后。两侧只在合理的平台连接处衔接，不在胳膊位置误连、分叉或消失。雨林P13采用已确认的两侧护栏修正版。

## 鸟类解剖、动态与道具连续性

- 按物种检查鸟喙、翅膀、腿脚、脚趾及其可见遮挡，不把一种鸟的脚趾结构套用到所有鸟。鸵鸟每脚为一大一小两趾，无后趾；不得画成三趾、猛禽爪或蹄形。
- 飞起、停栖和奔跑须能从姿态辨认：停栖时脚趾真实抓握枝条；已离枝的起飞瞬间，双脚应与枝条有可见间隙，双翼和身体动势协调，不画成展翅却仍牢牢站在原处。不要把“刚准备起飞”与“已离枝”混用。
- 表现快速前行时，步幅、重心、衣摆、头发和道具的动势一致，不能只加速度线而主体仍静止。小满以书本滑行的已确认页面保留真实旧绿皮硬壳书的书脊、页厚与展开书页，不换成地图、纸片或滑板。
- 逐页检查羽羽的戴胜鸟特征、书签尾羽和颈间小书挂件；运动和遮挡可以改变可见程度，但不能无故丢失标志性道具。保留各页已确认的鞋型和穿着，不因局部修图恢复错误旧版。
- **平放打开的精装书：** 先按视点确定书槽、左右纸张堆、封皮与地面的关系。朝向读者的近侧前沿通常呈现层叠纸边，绿封皮贴在纸张堆下方；装订处在书槽下方自然圆转，不画成一整块竖直面板，也不把左右外封面同时正面竖起当成书页支座。保留百科应有的厚度、人物手与纸页接触、纸张透视和落地阴影。不将此平放结构套用到明确腾飞或翻转的魔法封面。

## 水中倒影、透视与遮挡

- 先确定水面、视点，以及人物、鸟、栏杆与栈道的前后位置，再推断倒影的大致位置、尺度和可见范围；不能把主体简单上下翻转贴进任意空白水面。
- 同一水面上的人物、鸟和栏杆倒影应服从一致的空间关系。分别核对倒影对应哪一根立柱、哪一侧横栏及其上的角色，避免把近侧栏杆的倒影误当成远侧栏杆的倒影。
- **未看见倒影不自动等于漏画。** 倒影可能被栈道、岸边、前景、版面贴纸遮挡，或落在画幅外。根据构图核对后再判断；无法确定时如实说明，不为“补齐”而凭空添加位置错误的倒影。
- 应当可见的倒影须保留相应的形体和身份特征，允许水纹造成轻微破碎、变淡和扭曲，但不能改变物种、凭空少掉关键对象，或出现与实物不对应的栏杆、肢体和道具。
- 排版时尽量让重要的倒影关系可读；知识贴纸不得无意遮住叙事重点。若需移动贴纸或调整构图才能露出倒影，先核对留白、正文与主体遮挡，并在当前授权范围内处理；不得为了补倒影擅自大幅改变布局。

## 文件命名与当前项目

- 鸟类本轮允许改动构图并缩小主体：四边约12%—15%连续自然环境缓冲，核心人物动物向内收，装订侧额外避让，逐页检查实际边距。开放精装书要有左右朝上内页、中间书槽、纸堆下薄封皮；封面小满站在一侧书页上，不再站书脊或竖直封皮边。此最新要求优先于下文旧封面提示词。
- 鸟类录音机以[用户确认的P24造型与手部比例](../../鸟类绘本/制图参考/README.md)为唯一标准：深灰竖式小机身、单个圆形灰色防风毛罩、小屏、小红键与下部圆形控制区。P24原图不改，其他页统一同款与人物尺度；桌面与收纳状态也不能换款或变大音箱。每景一台，不复制包外设备。

- 当前文件范围和逐页索引见[仓库README](../../README.md)；文件页码用于排序，不渲染到标题中。
- 雨林按`热带雨林绘本/正式素材/P页码｜标题/`归档，每页保存`无字图-1254px.png`、`标题与正文-透明底.png`及有需要的专用纸签。来源与实际尺寸核对后逐字节保存，不为凑尺寸缩放场景。
- 雨林文案以[正式制图剧本](../../热带雨林绘本/正式制图剧本.md)及[制图约束](../../热带雨林绘本/制图约束规范.md)为准。P13保留两侧连续护栏，P15保留自然站姿和扶栏手臂。
- P15标题正文与百科采用P16参考的饱满手写笔触和暖棕配色，不回退到偏细僵直的文字风格。文字修订保持原文案与无字画面；新文字层按工具实际输出尺寸保存，不为对齐存量宽度插值放大。
- [草原剧本](../../非洲草原绘本/制图剧本.md)和[草原约束](../../非洲草原绘本/制图约束规范.md)尚未对应正式图像，不把剧本范围当作图页已完成。
- 文字分层、特殊页、字形修订和PDF要求见[图片生产与验收规范](references/image-production.md)。不交付合画重复文件、扩图、超清、旧版、工具缓存或历史制作记录。
- 鸟类按新编号保留已确认的P35三只火烈鸟和蓝灰湖水、P32双手在身前捧本的站姿、P36坐姿播放录音；正式图片以[素材索引](../../鸟类绘本/正式素材/README.md)列出的当前文件为准。新旧编号用章节对照表核对，雨林页码不随鸟类重排变化。
- 更新已命名文件前核实当前Git提交可恢复原文件。只修改用户指定范围，将跨页适用的新规则记录进本Skill。
- 用户要求同步上传时，验收后提交、推送并核实远端；没有上传授权时仅保存本地。只在用户明确要求时重置Git历史。

### Per-page continuity checklist

- Keep Xiaoman's face, short hair, cloth backpack, notebook and colored pencils continuous. Verify that clothing, hat and footwear suit the depicted conditions; do not default to rain boots on dry ground.
- Make Yuyu's crest reflect its emotional state and retain the bookmark-like tail.
- Verify that Yuyu has the hoopoe's long down-curved bill, black-tipped fan crest, and barred wings; reject any cockatiel or parrot-like anatomy.
- Verify that the cuckoo, if visible, is uncrested and gray-brown with a long tail; it must never borrow Yuyu's crest, barred wings, or gold-brown palette.
- Include at most one subtle cuckoo sound clue unless the manuscript calls for more.
- Place the hand-journal bird-fact sticker in a safe corner, clear of the gutter, focal action, and text-safe area.
- Preserve left-to-right reading flow and the warm watercolor-and-colored-pencil cartoon treatment.
- Verify the square format, habitat variety, child-to-bird sightline and activity, appropriate outfit/footwear, concise text, and heading slightly larger than body text.
- Inspect each hand separately at an enlarged view: four fingers plus one thumb structurally, plausible visible/occluded digits, correct wrist connection, and natural contact with face, knees or props. Do not accept a four-digit cartoon shortcut or force all fingertips to show.
- Check child proportions, body–furniture intersections, species-specific feet and legible motion; retain approved footwear, book props and Yuyu's pendant.
- For water scenes, map reflections to their actual sources and check perspective, ripples and occlusion by the deck, foreground and fact sticker before deciding a reflection is missing.

## Page 1: cover — current illustration brief

**Format and role:** 1:1 square, warm watercolor-and-colored-pencil children's cover, with separate text-free art and transparent lettering.

**Book structure:** A real giant hardback lies open with BOTH inner-page surfaces facing upward and a readable central gutter. Layered paper edges sit above thin green covers resting beneath the pages; the spine curves naturally below the gutter. Do not draw a green box, two upright cover panels, or one exposed cover standing as a wall. Xiaoman stands with both feet on one open inner-page surface, not on the spine or an upright cover edge. A few right-hand pages may lift gently like wings while preserving the two-sided open-book structure.

**Page illustrations:** The visible inner pages contain sparse flat watercolor field-guide drawings of birds, a wing, feathers and leaves. Let the drawings follow page perspective and curvature and disappear naturally beneath Xiaoman's shoes; keep them visibly printed/painted on paper. Do not leave the pages entirely blank, add lettering, or turn the drawings into extra living birds or pop-up scenery.

**Character and framing:** Keep the same five-year-old short-haired Xiaoman, cream leaf-patterned long sleeves, brick-red pinafore, socks and light brown canvas shoes. Her bag contains a notebook and colored pencils; a small recorder may preview a later chapter on this cover. One hand reaches toward a feather; the other balances naturally. Keep her complete body around 40% of the canvas height, with environmental space above, below, left and right. Check actual margins rather than assuming a requested percentage was obeyed.

**Yuyu:** Golden-brown hoopoe book sprite, long slender curved black bill, black-tipped cinnamon fan crest, black-and-cream barred wings, bookmark tail and small rust-red gold-edged book pendant. Keep the full bird inside the safe area.

**Background and clue:** Real sky, foliage, grass and distant landscape continue to all four edges, with rooftops, woodland, wetland and snow peaks suggesting a magical journey across habitats. A small uncrested gray cuckoo with barred pale belly, long tail and two tiny gold notes sits on a secondary midground branch. Do not add crowds to fill margins.

**Separate lettering:** Keep every word out of the text-free scene, including book-spine lettering. Render the following in the independent title/story PNG, using the rainforest-approved warm handwritten style and softly fading cream reading ground:

```text
羽毛图书馆：
会飞的鸟类大百科

翻开一页，就飞进一个鸟的世界。
听，布谷鸟在叫。
```

A separate transparent hand-drawn sticker uses the heading “寻找提示” and exact text: “羽毛和金色音符藏在哪里？跟着它们，开始探险吧。” Do not bake these layers into the original art.

The user's latest two-sided-book correction and binding-space instruction supersede the earlier spine-standing cover concept. Actual file availability is listed in the [bird asset index](../../鸟类绘本/正式素材/README.md).

## Prompt template

Write prompts in this order, using concrete and visual language:

```text
[format and page role].
Story moment: [one clear action and emotional turn].
Characters: [locked identity, scene-appropriate clothing/shoes/hat, action, expression, gaze target].
Setting: [real habitat, ground conditions, weather/time, meaningful story details].
Composition: [immersive camera angle, focal point, foreground/middle-ground/background, text-safe areas].
Art direction: [child-friendly cartoon style, medium, rounded line quality, texture, warm palette, lighting, level of detail].
Typography: [exact title, concise story with line breaks, exact fact, heading/body size ratio; or explicitly requested text-free output].
Keep: [continuity requirements, approved props and footwear; anatomically five-digit hands with natural occlusion and contact; physically coherent reflections where applicable].
Avoid: [unwanted elements, four-digit cartoon hands, extra/fused digits, distorted wrists, body–object intersections, missing signature props, misplaced reflections, accidental text, watermark, repetitive staging, clutter, unsafe or age-inappropriate material].
```

Prefer sensory specifics such as “misty pear orchard at sunrise” over abstract adjectives such as “magical.” Do not overload a prompt with incompatible styles, many simultaneous actions, or unranked details.

## Safety and age appropriateness

- Depict children and child-coded characters with dignity, practical age-appropriate clothing, and non-sexualized presentation.
- Avoid graphic injury, gore, cruelty, terror, weapons as a focal appeal, substance use, or hopelessness. If the story includes fear or danger, soften it through distance, implication, a trusted companion, visible escape, or a reassuring resolution.
- Avoid stereotypes and caricatures. Treat culture, disability, family structure, religion, and body diversity with specificity and respect; use supplied references for culturally grounded details.
- Do not imitate a living artist's style. Translate requests into non-identifying visual qualities instead (for example, “loose watercolor washes and lively ink contours”).

## Revision protocol

When revising an image, first separate **locked** from **editable** elements.

- Locked: story beat, character identity, count of characters, composition or camera, reading direction, style, and text-safe space unless explicitly changed.
- Editable: the user's named change and only the visual consequences needed to integrate it.

Phrase the revision as: “Preserve [locked elements]. Change only [requested elements].” Recheck that the edit did not introduce extra limbs, altered faces, changed costumes, accidental text, or a shifted focal point.

## Quality gate

Before delivering, verify:

- A child can identify the main action and emotion at thumbnail size.
- The image advances the story rather than merely decorating it.
- Characters are continuous with the character bible and each other.
- Hands, limbs, eyes, clothing, and objects are coherent and usable.
- Both hands have been inspected individually at an enlarged view for five-digit structure, plausible occlusion, correct thumbs, child-sized proportions, and believable contact. A thumbnail-only review is insufficient for hand corrections.
- Bodies do not pass through furniture or props; bird feet and action match the species and story; approved footwear and Yuyu's book pendant remain continuous.
- Where water is present, reflections match their sources, perspective and occlusion. Missing reflections have been distinguished from genuinely hidden or off-canvas reflections, and fact stickers do not inadvertently conceal a key story relationship.
- The focal point is clear; background detail does not compete with it.
- Composed pages have quiet, usable text space; separate text-free scenes have complete backgrounds without leftover typography masks or sticker outlines.
- Spread artwork respects the gutter and reading direction.
- No accidental lettering, logo, watermark, visual artifact, or unsafe/age-inappropriate content is present.
- Palette, contrast, and texture support the intended feeling and reproduce plausibly in print.
- The image reads as a warm children's-book cartoon: forms are friendly and expressive, colors feel sunlit and cohesive, and no photorealistic or cold, oppressive treatment has slipped in.
- The habitat, pose, framing and light are sufficiently distinct from neighboring pages without forcing a season change or moving a bird into an unsuitable environment.
- Xiaoman's outfit and footwear suit the actual activity and ground; her face, age and short hair remain recognizable.
- Requested text is complete and legible, story remains concise, title is slightly larger than body and contains no printed page-number prefix, and story/fact content matches the final scene.
- Files use the current formal page directories and numbering; previous confirmed files are recoverable from verified Git commits.

If any check fails, revise the prompt or image with the smallest targeted correction rather than regenerating blindly.
