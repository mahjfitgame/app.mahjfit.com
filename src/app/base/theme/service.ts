// file: app/base/theme/component.ts

import { inject, Injectable, Service } from "@angular/core";
import { ThemeState } from "@base/theme/state";
import { THEME_PREFERENCE_OPTIONS } from "@base/theme/const";

@Service()
export class ThemeService {
    public THEME_PREFERENCE_OPTIONS = THEME_PREFERENCE_OPTIONS;
    public readonly state = inject(ThemeState)
    constructor() {}
}