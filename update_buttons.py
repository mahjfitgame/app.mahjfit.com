import re

with open("src/app/module/business/game/phaser/template.html", "r") as f:
    content = f.read()

# Replace button class and remove background/color/shadow/opacity inline styles
content = content.replace('class="instruction-panel__button"', 'class="instruction-panel__button btn-primary"')

# Secondary button needs btn-secondary
content = content.replace(
    '<button type="button" class="instruction-panel__button btn-primary" [style.left.px]="state.secondaryButton.x',
    '<button type="button" class="instruction-panel__button btn-secondary" [style.left.px]="state.secondaryButton.x'
)

content = content.replace(
    '<button type="button" class="instruction-panel__button btn-primary" [style.left.px]="state.skipButton.x',
    '<button type="button" class="instruction-panel__button btn-secondary" [style.left.px]="state.skipButton.x'
)

# Remove inline styles that override our tailwind
content = re.sub(r'\[style\.background\]="getInstructionButtonBackground[^"]*"', '', content)
content = re.sub(r'\[style\.background\]="state\.[^"]*background \|\| getInstructionButtonBackground[^"]*"', '', content)
content = re.sub(r'\[style\.opacity\]="[^"]*"', '', content)
content = re.sub(r'\[style\.boxShadow\]="getInstructionButtonShadow[^"]*"', '', content)
content = re.sub(r'\[style\.boxShadow\]="[^"]*shadowY[^"]*"', '', content)
content = re.sub(r'\[style\.color\]="state\.[^"]*\.color"', '', content)

with open("src/app/module/business/game/phaser/template.html", "w") as f:
    f.write(content)

print("Done")
