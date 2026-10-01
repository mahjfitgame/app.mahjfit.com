BRAND GUID: theme/open/Majhfit Design System-Sep2026.pdf
BRAND ASSETS: theme/open/Branding

FONT: theme/open/Branding/Fonts

SPLASH SCREEN
theme/open/Splash Screen/splash-logo-progressbar-2732.png
also get idea about GRADIENT related things from splash screen and BRAND GUID

MAIN LOGO:
primary: theme/open/Branding/Logos/Logos no tag/Logo_magenta_blue_notag.svg
secondary: theme/open/Branding/Logos/Logos no tag/Logo_blue_red_notag.svg

FAVICON:
theme/open/Branding/Favicon/favicon-flwr-magenta-32x32.png

THEME SPECIFIC STYLE:
src/theme/open

DESIGN RAW MATERIAL:
theme/open

NEW DESING WORKSPACE:
src/app/area/open/design-html
possible src/app/area/open/design-html/template.html

NEW THEME ASSETS INSIDE:
public/open
you can add required not found assets insid during design process
in direct folder
public/open/assets

SOME GENERAL ASSETS
public/assets
you can copy some if you need to
---

you are a very talented web designer who can work with graphics and web design related work for web and have strong understanding of angular-material and taiwindcss.

we need to develop new html design as per provided feferen images and pdf 

predefine reference is 
theme/open/home-desktop-1920x1080-v5.psd
theme/open/mahjfit-desktop-1-startscreen.pdf
we must follow this 

we need to conbile and create new design layout 
for more content you can refre
theme/open

THEME SPECIFIC STYLE:
src/theme/open
you might find some difference in theme css compare to BRAND GUID but its okay

1st is home page design 
and inside we need 3 main things 
header - main body - footer
1st we will go for header.

we are trailwindcss based so you need to use it no addition css.
if really really required then add in 
src/theme/open/_layout.scss
open-area-layout-component {}
as per standards and code pattern (you can learn patterns and standards from private-area-layout-component css alredy in - but its for admin area but its more similr so you can learn from it)

i have create a development module component for design
src/app/area/open/design-html
where we need to work specially w eneed to create html in
src/app/area/open/design-html/template.html

lets create a header and footer no obody part 
once you add html in template.html i will run it in browser and will check how it looks

how your design will work and hhow tailwindcss need to use you can refere
src/app/area/private/template.html
our new design will also load in simae way

---
CONCEPT:
BUILD

A single-file HTML landing page for an online Mahjong game. Tailwind CSS via CDN, no build step, no framework. One .html file that opens in a browser.

THE CONCEPT — "The Table at Night"

The page should feel like sitting down at a lamplit table late in the evening: deep, warm, quiet, with the tiles as the only bright objects. Not a casino, not a mobile-game storefront. Closer to a well-made board game's packaging than to a free-to-play app.

Visual direction:

 background as per theme, the colour of a felt table in low light
Tiles are bone-white with a subtle warm cast, and they are the only light source on the page
 used sparingly — active states and the primary CTA only
Serif display type for headings, clean sans for everything else
Generous negative space. The page should feel calm, not busy.

SECTIONS, IN ORDER

Hero — Full viewport height. Left: headline, one line of subcopy, primary CTA "Play now" and a quiet secondary "How to play". Right: a loose arrangement of 5–6 CSS-drawn Mahjong tiles at slight rotations, overlapping, as if just dealt. Tiles drawn with divs and CSS — rounded rectangles, soft inner shadow, a thin bottom edge to suggest thickness. Draw simple abstract suit marks with CSS shapes only.
Three game modes — Three cards: Classic Solitaire, Four-Player Live, Daily Puzzle. Each with a title, two lines of description, and a small stat (players online, average time, today's streak). Cards are slightly raised from the background, not outlined boxes.
How it works — Three numbered steps, horizontal on desktop, stacked on mobile. Minimal: number, short title, one sentence.
A single quiet stat band — Three figures side by side: games played, players worldwide, average round length. Large numerals, small labels. No chart.
Footer — Logo, four short link columns, copyright. Understated.

TILE RENDERING

you can use use images, emoji, or icon fonts. Build each tile from HTML/CSS:

Bone gradient face, slightly darker right and bottom edges for depth
Suit marks drawn with CSS: bamboo as stacked rounded bars, circles as concentric rings, characters as simple geometric strokes
In the hero, rotate each tile between -8° and +8° and overlap them

MOTION

Restrained. Hero tiles settle into place on load with a short stagger. Cards lift 2px on hover. Nothing loops, nothing pulses, nothing auto-plays.

CONSTRAINTS

Single .html file, everything inline
Tailwind via CDN, custom colours defined in a tailwind.config script block
Fonts from Google Fonts
Mobile-first; check the 768–1024px band specifically
Semantic HTML, headings in order, real <button> elements
Visible focus rings on every interactive element
No gradients except on tile faces
No stock-photo placeholders, no lorem ipsum — write real copy
No emoji anywhere

OUTPUT

The complete HTML file, nothing else. No explanation before or after.

Using it. Swap the concept block if you want a different direction — the structure holds, and only the visual direction paragraph and colour values need changing. Two alternatives if "The Table at Night" isn't right:

"Paper and Ink" — off-white paper background, ink-black type, vermilion accent, tiles as flat woodblock-print shapes. Very quiet, editorial.
"Jade Arcade" — near-black, jade green glow, tiles with soft rim light. Modern, closer to a competitive gaming site.

The reason this produces something better than "make a modern Mahjong homepage" is that every vague decision is already made — palette, mood, section order, what's in each section, how the tiles get drawn. What's left for the model is execution, which is what it's actually good at.

One thing to expect: CSS-drawn tiles usually need one round of correction. When they come back wrong, describe the specific geometry that's off rather than saying "make the tiles better.

---

PAGE LIST:
Home page
theme/open/mahjfit-desktop-1-startscreen.pdf
For home page, we might required some different content at this moment we only have pricing plan.
At initially, we can do like free plan and premium is upcoming or we can decide some contant for home page.
 
Signin
Signup
Forgot password
Start new game page or popup
This layout will be utiliaze with all above 4 pages/popup.
theme/open/mahjfit-desktop-3-memberlogin.pdf
 
User logged in dashboard
theme/open/home-desktop-1920x1080-v5.psd 
 
Privacy policy
Term of use
Cookie policy
We will just create a simple page using home page design with text contant and you guys have to decide all policies or let me know if you want me to create all those policies.
 
Contact us
We need page design for this.
 
Game play area
All set