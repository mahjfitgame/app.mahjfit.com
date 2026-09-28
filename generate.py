from PIL import Image

# Load the original image
img = Image.open("public/assets/game/tiles/2xnew/tiles_2x.png").convert("RGBA")

# Create a new transparent image with dimensions 2048x2048
new_size = (2048, 2048)
atlas_2048 = Image.new("RGBA", new_size, (0, 0, 0, 0))

# Paste the original image anchored at the top-left corner (0, 0)
atlas_2048.paste(img, (0, 0))

# Save the final image
atlas_2048.save("public/assets/game/tiles/2xnew/tiles_2x_paded_2048.png", "PNG")