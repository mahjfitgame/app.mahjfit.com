// file: src/app/base/image-slideshow/provider.ts
import { Provider } from '@angular/core';
import { ImageSlideshowService } from '@base/image-slideshow/service';
import { ImageSlideshowState } from '@base/image-slideshow/state';

export const IMAGE_SLIDESHOW_PROVIDERS: Provider[] = [
    ImageSlideshowState,
    ImageSlideshowService,
];
