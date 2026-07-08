// file: ./libs/src/date-time/provider.ts
import { importProvidersFrom, LOCALE_ID } from '@angular/core';
import { OWL_DATE_TIME_FORMATS, OWL_DATE_TIME_LOCALE, OwlDateTimeFormats, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { ConfService } from '@libs/conf/service';

export function dateTimeOwlDateTimeFormatFactory(conf: ConfService) {
    const format: OwlDateTimeFormats =  {
        // Aligns with FORMAT_DATE_TIME: 'd MMM yyyy hh:mm:ss aaa'
        // Result: "5 May 2026 09:15:30 AM" (single digit day, double digit hour/min/sec)
        parseInput: conf.formatDateTimeObj,
        fullPickerInput: conf.formatDateTimeObj,
        
        // Aligns with FORMAT_DATE: 'd MMM yyyy'
        // Result: "5 May 2026"
        datePickerInput: conf.formatDateObj,
        
        // Aligns with FORMAT_TIME: 'hh:mm aaa'
        // Result: "09:15 AM" (Notice seconds are excluded here)
        timePickerInput: conf.formatTimeObj,
        
        // Aligns with FORMAT_MONTH_YEAR: 'MMM yyyy'
        // Result: "May 2026"
        monthYearLabel: conf.formatMonthYearObj,
        
        // Accessibility screen reader formats (keep full detail)
        dateA11yLabel: conf.formatDateObj,
        monthYearA11yLabel: conf.formatMonthYearObj
    };

    return format;
}
export function dateTimeOwlDateTimeLocaleFactory(conf: ConfService) {
    return conf.languageCode;
}
export function provideDateTimeFormat() { 
    return [
        {
            provide: LOCALE_ID,
            useFactory: (conf: ConfService) => conf.languageCode,
            deps: [ConfService]
        },
        {
            provide: OWL_DATE_TIME_FORMATS,
            useFactory: dateTimeOwlDateTimeFormatFactory,
            deps: [ConfService],
        },
        {
            provide: OWL_DATE_TIME_LOCALE, 
            useFactory: dateTimeOwlDateTimeLocaleFactory,
            deps: [ConfService],
        },
    ];
}